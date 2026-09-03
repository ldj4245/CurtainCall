import{c as r,f as s}from"./index-1j3fZDPS.js";/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=r("Heart",[["path",{d:"M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z",key:"c3ymky"}]]);/**
 * @license lucide-react v0.365.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const m=r("RefreshCw",[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]]),n={toggle:e=>s.post(`/favorites/shows/${e}`).then(t=>t.data),getStatus:e=>s.get(`/favorites/shows/${e}/status`).then(t=>t.data),getMyFavorites:(e=0,t=12)=>s.get("/favorites/my",{params:{page:e,size:t}}).then(a=>a.data)},p={getByShow:(e,t="latest",a=0,o=10)=>s.get(`/shows/${e}/reviews`,{params:{sort:t,page:a,size:o}}).then(h=>h.data),create:(e,t)=>s.post(`/shows/${e}/reviews`,t).then(a=>a.data),update:(e,t)=>s.put(`/reviews/${e}`,t).then(a=>a.data),delete:e=>s.delete(`/reviews/${e}`),toggleLike:e=>s.post(`/reviews/${e}/like`).then(t=>t.data),getComments:(e,t=0,a=20)=>s.get(`/reviews/${e}/comments`,{params:{page:t,size:a}}).then(o=>o.data),createComment:(e,t,a)=>s.post(`/reviews/${e}/comments`,{content:t,parentId:a}).then(o=>o.data),deleteComment:e=>s.delete(`/comments/${e}`),getMyReviews:(e=0,t=10)=>s.get("/reviews/my",{params:{page:e,size:t}}).then(a=>a.data)};export{d as H,m as R,n as f,p as r};
