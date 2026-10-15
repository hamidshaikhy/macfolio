import type { Plugin, ViteDevServer } from 'vite';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import sources from '../integrations/sources.json';

// Child Vite servers are in-process and created only on a request to their own prefix.
export function integrations(): Plugin {
  const children = new Map<string, Promise<ViteDevServer>>();
  const root = fileURLToPath(new URL('../', import.meta.url));
  return {
    name: 'macfolio-isolated-apps',
    configureServer(server) {
      server.httpServer?.on('close',()=>{ for (const child of children.values()) void child.then(c=>c.close()); });
      server.middlewares.use(async (req,res,next)=>{
        const pathname = new URL(req.url || '/', 'http://localhost').pathname;
        const app = sources.find(a=>pathname === a.path.slice(0,-1) || pathname.startsWith(a.path));
        if (!app) return next();
        if (pathname === app.path.slice(0,-1)) { res.writeHead(307,{Location:app.path+new URL(req.url || '/', 'http://localhost').search}); res.end(); return; }
        try {
          if (!children.has(app.id)) children.set(app.id,(async()=>{
            const vite = await import(pathToFileURL(resolve(root,`integrations/${app.id}/node_modules/vite/dist/node/index.js`)).href);
            return vite.createServer({root:resolve(root,`integrations/${app.id}`), base:app.path, server:{middlewareMode:true, hmr:{server:server.httpServer,path:app.path+'hmr'}}});
          })());
          const child = await children.get(app.id)!;
          child.middlewares(req,res,()=>{res.statusCode=404;res.end('App asset not found');});
        } catch (error) { server.config.logger.error(`Cannot start ${app.id}: ${String(error)}`);res.statusCode=503;res.end(`Cannot start ${app.id}. Run npm run apps:install.`); }
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((req,_res,next)=>{
        const url = new URL(req.url || '/', 'http://localhost');
        const app = sources.find(a=>url.pathname === a.path.slice(0,-1) || url.pathname.startsWith(a.path));
        // Real assets go through Vite's static server; only known document routes fall back.
        if (app && (url.pathname === app.path.slice(0,-1) || url.pathname === app.path || url.pathname === app.path+'builder' && app.id === 'barg')) req.url = app.path+'index.html'+url.search;
        next();
      });
    },
  };
}
