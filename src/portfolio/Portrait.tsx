import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { asset } from '../lib/assets';

export const naturalPortrait = asset('assets/portfolio/hamid-natural-1024-v2.webp');
export const hardwarePortrait = asset('assets/portfolio/hamid-hardware-1024-v6.webp');
const smallNatural = asset('assets/portfolio/hamid-natural-512-v2.webp');
const smallHardware = asset('assets/portfolio/hamid-hardware-512-v6.webp');

// Both textures share a canvas and pose. HTML layers survive context loss.
const vertex = `attribute vec2 position; varying vec2 uv; void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}`;
const fragment = `#ifdef GL_FRAGMENT_PRECISION_HIGH
precision highp float;
#else
precision mediump float;
#endif
uniform sampler2D human; uniform sampler2D hardware;
uniform vec2 pointer; uniform float aspect; uniform float reveal; uniform float locked; uniform float automatic;
uniform vec2 parallax; varying vec2 uv;
uniform vec4 field[24]; uniform float liquidActive;
void main(){
 vec2 point=uv+parallax*.002*(1.-abs(uv.y-.55));
 vec4 base=texture2D(human,point); vec4 tech=texture2D(hardware,point);
 float d=length((uv-pointer)*vec2(aspect,1.));
 float band=1.-smoothstep(.055,.13,abs(uv.y-pointer.y+sin(uv.x*8.+pointer.y*12.)*.022));
 float density=0.;for(int i=0;i<24;i++){vec4 particle=field[i];vec2 delta=(uv-particle.xy)*vec2(aspect,1.);density+=particle.w*particle.w*particle.z/(dot(delta,delta)+.0002);}
 float liquid=smoothstep(.75,2.8,density);
 float roundMask=1.-smoothstep(.065,.155,d);
 float wipe=(1.-smoothstep(locked-.015,locked+.015,1.-uv.y))*step(.001,locked);
 if(locked>.999)wipe=1.;
 float mask=max(wipe,max(mix(roundMask,band,automatic)*reveal*(1.-liquidActive*.8),liquid*liquidActive));
 gl_FragColor=mix(base,tech,mask);
}`;

export default function Portrait({ reducedMotion }: { reducedMotion: boolean }) {
  const frame = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const animation = useRef(0);
  const render = useRef<(() => void) | null>(null);
  const current = useRef({ x: .5, y: .35, reveal: 0, lock:0 });
  const target = useRef({ x: .5, y: .35, reveal: 0 });
  const lockedRef = useRef(false);
  const ambient = useRef(false);
  const liquidField=useRef(new Float32Array(96));
  const liquidActive=useRef(false);
  const reduced = useRef(reducedMotion);
  const [locked, setLocked] = useState(false);
  const [webglReady,setWebglReady]=useState(false);

  function animate() {
    if (animation.current) return;
    let previousTime=performance.now();
    const step = (now:number) => {
      animation.current = 0;
      const element = frame.current;
      if (!element?.getClientRects().length || document.hidden) return;
      const c = current.current, t = target.current;
      const ease = reduced.current ? 1 : .2;
      c.x += (t.x-c.x)*ease; c.y += (t.y-c.y)*ease; c.reveal += (t.reveal-c.reveal)*ease;
      const lockTarget=lockedRef.current?1:0,delta=reduced.current?1:Math.min(64,now-previousTime)/900;
      previousTime=now;
      c.lock+=Math.sign(lockTarget-c.lock)*Math.min(Math.abs(lockTarget-c.lock),delta);
      element.style.setProperty('--lock-reveal',String(c.lock));
      element.dataset.lockWipe=String(c.lock>0);
      element.style.setProperty('--reveal-x', `${c.x*100}%`);
      element.style.setProperty('--reveal-y', `${c.y*100}%`);
      element.style.setProperty('--reveal-opacity', String(c.reveal));
      element.style.setProperty('--portrait-x', `${reduced.current ? 0 : (c.x-.5)*5*c.reveal}px`);
      element.style.setProperty('--portrait-y', `${reduced.current ? 0 : (c.y-.5)*3*c.reveal}px`);
      element.closest<HTMLElement>('.pf-hero')?.style.setProperty('--inspecting',String(Math.max(c.reveal,lockedRef.current?1:0)));
      render.current?.();
      if (!reduced.current && (Math.abs(c.x-t.x)+Math.abs(c.y-t.y)+Math.abs(c.reveal-t.reveal)>.002||Math.abs(c.lock-lockTarget)>.00001)) animation.current=requestAnimationFrame(step);
    };
    animation.current = requestAnimationFrame(step);
  }
  useEffect(() => {
    lockedRef.current=locked; reduced.current=reducedMotion;
    if(reducedMotion) target.current.reveal=0;
    animate();
  },[locked,reducedMotion]);
  useEffect(() => {
    const element=canvas.current, host=frame.current;
    if(!element||!host) return;
    // Native image compositing avoids device-specific transparent WebGL texture
    // artifacts on touch GPUs. The image layers keep the same reveal and wipe.
    if(window.matchMedia('(hover: none) and (pointer: coarse)').matches) return;
    let disposed=false;
    let gl: WebGLRenderingContext | null=null;
    let observer: ResizeObserver | undefined;
    let program: WebGLProgram | undefined;
    let buffer: WebGLBuffer | null=null;
    const textures: WebGLTexture[]=[];
    const shaders: WebGLShader[]=[];
    const fallback=()=>{setWebglReady(false);delete element.dataset.ready;render.current=null;};
    try {
      // Keep the upload, shader output and browser compositor in premultiplied
      // alpha throughout; straight-alpha conversion damages soft edges on iOS.
      gl=element.getContext('webgl',{alpha:true,premultipliedAlpha:true,antialias:false,preserveDrawingBuffer:true});
      if(gl) {
        const context=gl;
        const compile=(type:number,source:string)=>{
          const shader=context.createShader(type)!;context.shaderSource(shader,source);context.compileShader(shader);
          if(!context.getShaderParameter(shader,context.COMPILE_STATUS)) {context.deleteShader(shader);throw new Error('Portrait shader unavailable');}
          shaders.push(shader);return shader;
        };
        program=context.createProgram()!;
        context.attachShader(program,compile(context.VERTEX_SHADER,vertex));context.attachShader(program,compile(context.FRAGMENT_SHADER,fragment));context.linkProgram(program);
        if(!context.getProgramParameter(program,context.LINK_STATUS)) throw new Error('Portrait graphics unavailable');
        context.useProgram(program);
        buffer=context.createBuffer();context.bindBuffer(context.ARRAY_BUFFER,buffer);
        context.bufferData(context.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),context.STATIC_DRAW);
        const attribute=context.getAttribLocation(program,'position');context.enableVertexAttribArray(attribute);context.vertexAttribPointer(attribute,2,context.FLOAT,false,0,0);
        const uniforms=Object.fromEntries(['pointer','aspect','reveal','locked','parallax','automatic','liquidActive'].map(name=>[name,context.getUniformLocation(program!,name)]));
        const fieldUniform=context.getUniformLocation(program!,'field[0]');
        const images=[new Image(),new Image()];
        const useSmall=host.clientWidth*(window.devicePixelRatio||1)<=512;
        Promise.all(images.map((image,index)=>new Promise<void>((resolve,reject)=>{
          image.onload=()=>resolve();image.onerror=reject;image.src=useSmall?[smallNatural,smallHardware][index]:[naturalPortrait,hardwarePortrait][index];
        }))).then(()=>{
          if(disposed||context.isContextLost()) return;
          images.forEach((image,index)=>{
            const texture=context.createTexture()!;textures.push(texture);context.activeTexture(context.TEXTURE0+index);context.bindTexture(context.TEXTURE_2D,texture);
            context.pixelStorei(context.UNPACK_FLIP_Y_WEBGL,true);
            context.pixelStorei(context.UNPACK_PREMULTIPLY_ALPHA_WEBGL,true);
            context.texParameteri(context.TEXTURE_2D,context.TEXTURE_MIN_FILTER,context.LINEAR);context.texParameteri(context.TEXTURE_2D,context.TEXTURE_MAG_FILTER,context.LINEAR);
            context.texParameteri(context.TEXTURE_2D,context.TEXTURE_WRAP_S,context.CLAMP_TO_EDGE);context.texParameteri(context.TEXTURE_2D,context.TEXTURE_WRAP_T,context.CLAMP_TO_EDGE);
            context.texImage2D(context.TEXTURE_2D,0,context.RGBA,context.RGBA,context.UNSIGNED_BYTE,image);
            context.uniform1i(context.getUniformLocation(program!,index===0?'human':'hardware'),index);
          });
          render.current=()=>{
            if(disposed||context.isContextLost()||!host.getClientRects().length||document.hidden)return;
            const c=current.current;
            context.uniform2f(uniforms.pointer,c.x,1-c.y);context.uniform1f(uniforms.aspect,2/3);
            context.uniform1f(uniforms.reveal,reduced.current?0:c.reveal);context.uniform1f(uniforms.locked,c.lock);
            context.uniform1f(uniforms.automatic,ambient.current?1:0);
            context.uniform4fv(fieldUniform,liquidField.current);context.uniform1f(uniforms.liquidActive,!reduced.current&&liquidActive.current?1:0);
            context.uniform2f(uniforms.parallax,reduced.current?0:c.x-.5,reduced.current?0:c.y-.5);
            context.clearColor(0,0,0,0);context.clear(context.COLOR_BUFFER_BIT);context.drawArrays(context.TRIANGLES,0,6);
          };
          const resize=()=>{
            const width=host.clientWidth;if(!width)return;
            const pixelWidth=Math.round(Math.min(1440,width*Math.min(window.devicePixelRatio||1,2)));
            element.width=pixelWidth;element.height=Math.round(pixelWidth*1.5);context.viewport(0,0,element.width,element.height);
            render.current?.();
          };
          observer=new ResizeObserver(resize);observer.observe(host);resize();
          element.dataset.ready='true';setWebglReady(true);
        }).catch(()=>{if(!disposed)fallback();});
      }
    } catch {fallback();}
    const lost=(event: Event)=>{event.preventDefault();fallback();};
    const visible=()=>{if(document.hidden){cancelAnimationFrame(animation.current);animation.current=0;}else render.current?.();};
    element.addEventListener('webglcontextlost',lost);document.addEventListener('visibilitychange',visible);
    return ()=>{
      disposed=true;cancelAnimationFrame(animation.current);animation.current=0;observer?.disconnect();render.current=null;
      element.removeEventListener('webglcontextlost',lost);document.removeEventListener('visibilitychange',visible);
      if(gl){textures.forEach(t=>gl!.deleteTexture(t));shaders.forEach(s=>gl!.deleteShader(s));if(buffer)gl.deleteBuffer(buffer);if(program)gl.deleteProgram(program);}
    };
  },[]);
  useEffect(()=>{
    const element=frame.current,host=element?.closest<HTMLElement>('.pf-experience');if(!element||!host)return;
    const inspect=(event:Event)=>{
      const {x,y,active}=(event as CustomEvent<{x:number;y:number;active:boolean}>).detail;
      if(reduced.current)return;
      if(active){const local=element.getBoundingClientRect(),bounds=host.getBoundingClientRect();ambient.current=true;element.classList.add('is-ambient');target.current={x:(x+bounds.left-local.left)/local.width,y:(y+bounds.top-local.top)/(local.width*1.5),reveal:1};}
      else if(ambient.current){target.current.reveal=0;}
      animate();
    };
    const field=(event:Event)=>{
      if(host.dataset.scene!=='home'||reduced.current)return;
      const {points,active}=(event as CustomEvent<{points:Float32Array;active:boolean}>).detail;
      const box=element.getBoundingClientRect(),bounds=host.getBoundingClientRect();if(!box.width)return;
      const height=box.width*1.5,values=liquidField.current;
      for(let i=0;i<24;i++){values[i*4]=(points[i*4]*bounds.width-(box.left-bounds.left))/box.width;values[i*4+1]=1-((1-points[i*4+1])*bounds.height-(box.top-bounds.top))/height;values[i*4+2]=points[i*4+2];values[i*4+3]=points[i*4+3]*bounds.height/height;}
      liquidActive.current=active;render.current?.();
    };
    host.addEventListener('pf-ambient-inspect',inspect);host.addEventListener('pf-liquid-field',field);
    return()=>{host.removeEventListener('pf-ambient-inspect',inspect);host.removeEventListener('pf-liquid-field',field);};
  },[]);
  function follow(event: PointerEvent<HTMLDivElement>) {
    if(reducedMotion||event.pointerType==='touch')return;
    ambient.current=false;event.currentTarget.classList.remove('is-ambient');
    const box=event.currentTarget.getBoundingClientRect();
    target.current={x:(event.clientX-box.left)/box.width,y:(event.clientY-box.top)/(box.width*1.5),reveal:1};animate();
  }
  return <div className="pf-portrait-wrap">
    <div className={`pf-portrait ${webglReady?'is-webgl':''} ${locked?'is-inspected':''}`} data-renderer={webglReady?'webgl':'image'} ref={frame} onPointerMove={follow}
      onPointerLeave={()=>{target.current.reveal=0;animate();}} onClick={()=>setLocked(!locked)}>
      <img className="pf-photo" src={naturalPortrait} srcSet={`${smallNatural} 512w, ${naturalPortrait} 1024w`} sizes="(max-width: 700px) 90vw, 53vw" width="1024" height="1536" alt="Hamid Shaikhy, full upper-body portrait" fetchPriority="high" />
      <div className="pf-circuit" aria-hidden="true"><img src={hardwarePortrait} srcSet={`${smallHardware} 512w, ${hardwarePortrait} 1024w`} sizes="(max-width: 700px) 90vw, 53vw" width="1024" height="1536" alt="" /></div>
      <canvas className="pf-portrait-canvas" ref={canvas} aria-hidden="true" />
    </div>
    <div className="pf-portrait-caption"><span>MOVE TO REVEAL · CLICK TO LOCK</span><button aria-pressed={locked} aria-label={locked?'Close inspection':'Inspect portrait'} onClick={()=>setLocked(!locked)}>{locked?'Unlock circuit view ↗':'Lock circuit view ↗'}</button></div>
  </div>;
}
