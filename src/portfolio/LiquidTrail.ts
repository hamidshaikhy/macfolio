// Small, transparent metaball field. Trails curl and diffuse rather than
// leaving a row of rigid circles. No textures, network assets or idle loop.
export function createLiquidTrail(canvas:HTMLCanvasElement) {
  const gl=canvas.getContext('webgl',{alpha:true,premultipliedAlpha:false,antialias:false});
  if(!gl)return null;
  const shaders:WebGLShader[]=[];
  const compile=(type:number,source:string)=>{const shader=gl.createShader(type)!;shaders.push(shader);gl.shaderSource(shader,source);gl.compileShader(shader);if(!gl.getShaderParameter(shader,gl.COMPILE_STATUS))throw new Error('Liquid shader unavailable');return shader;};
  const program=gl.createProgram()!;
  try {
    gl.attachShader(program,compile(gl.VERTEX_SHADER,'attribute vec2 position;varying vec2 uv;void main(){uv=position*.5+.5;gl_Position=vec4(position,0.,1.);}'));
    gl.attachShader(program,compile(gl.FRAGMENT_SHADER,`precision mediump float;varying vec2 uv;uniform vec4 points[24];uniform float aspect;uniform float time;
    void main(){float field=0.;for(int i=0;i<24;i++){vec4 point=points[i];vec2 delta=(uv-point.xy)*vec2(aspect,1.);float age=1.-point.z;
      delta+=vec2(sin(uv.y*19.+time*2.4+age*7.),cos(uv.x*14.-time*1.7+age*5.))*.013*age;
      float radius=point.w*(.7+age*.6);field+=radius*radius*point.z/(dot(delta,delta)+.0004);}
      float edge=smoothstep(.75,2.8,field);float sheen=exp(-abs(field-2.6)*2.);
      vec3 color=mix(vec3(.16,.37,.29),vec3(.33,.61,.48),sheen*.5);
      gl_FragColor=vec4(color,edge*.16+sheen*.022);}`));
    gl.linkProgram(program);if(!gl.getProgramParameter(program,gl.LINK_STATUS))throw new Error('Liquid graphics unavailable');
  } catch {shaders.forEach(shader=>gl.deleteShader(shader));gl.deleteProgram(program);return null;}
  gl.useProgram(program);
  const buffer=gl.createBuffer();gl.bindBuffer(gl.ARRAY_BUFFER,buffer);gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]),gl.STATIC_DRAW);
  const position=gl.getAttribLocation(program,'position');gl.enableVertexAttribArray(position);gl.vertexAttribPointer(position,2,gl.FLOAT,false,0,0);
  const points=gl.getUniformLocation(program,'points[0]'),aspect=gl.getUniformLocation(program,'aspect'),time=gl.getUniformLocation(program,'time');
  const pool:{x:number;y:number;at:number;radius:number}[]=[];const uniforms=new Float32Array(96);
  let width=1,height=1;
  return {
    resize(w:number,h:number){width=w;height=h;canvas.width=Math.max(1,Math.round(Math.min(1000,w)));canvas.height=Math.max(1,Math.round(canvas.width*h/w));gl.viewport(0,0,canvas.width,canvas.height);},
    add(x:number,y:number,now:number,automatic=false){pool.push({x:x/width,y:1-y/height,at:now,radius:automatic?.085:.047});if(pool.length>24)pool.shift();},
    draw(now:number){while(pool.length&&now-pool[0].at>850)pool.shift();uniforms.fill(0);pool.forEach((point,i)=>{uniforms[i*4]=point.x;uniforms[i*4+1]=point.y;uniforms[i*4+2]=Math.pow(Math.max(0,1-(now-point.at)/850),1.6);uniforms[i*4+3]=point.radius;});gl.uniform4fv(points,uniforms);gl.uniform1f(aspect,width/height);gl.uniform1f(time,now/1000);gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);gl.drawArrays(gl.TRIANGLES,0,6);return pool.length>0;},
    clear(){pool.length=0;gl.clearColor(0,0,0,0);gl.clear(gl.COLOR_BUFFER_BIT);},
    field(){return uniforms;},
    destroy(){gl.deleteBuffer(buffer);gl.deleteProgram(program);shaders.forEach(shader=>gl.deleteShader(shader));},
  };
}
