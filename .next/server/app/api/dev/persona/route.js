/*
 * ATTENTION: An "eval-source-map" devtool has been used.
 * This devtool is neither made for production nor for readable output files.
 * It uses "eval()" calls to create a separate source file with attached SourceMaps in the browser devtools.
 * If you are trying to read the output file, select a different devtool (https://webpack.js.org/configuration/devtool/)
 * or disable the default devtool with "devtool: false".
 * If you are looking for production-ready output files, see mode: "production" (https://webpack.js.org/configuration/mode/).
 */
(() => {
var exports = {};
exports.id = "app/api/dev/persona/route";
exports.ids = ["app/api/dev/persona/route"];
exports.modules = {

/***/ "next/dist/compiled/next-server/app-page.runtime.dev.js":
/*!*************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-page.runtime.dev.js" ***!
  \*************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-page.runtime.dev.js");

/***/ }),

/***/ "next/dist/compiled/next-server/app-route.runtime.dev.js":
/*!**************************************************************************!*\
  !*** external "next/dist/compiled/next-server/app-route.runtime.dev.js" ***!
  \**************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/compiled/next-server/app-route.runtime.dev.js");

/***/ }),

/***/ "../app-render/after-task-async-storage.external":
/*!***********************************************************************************!*\
  !*** external "next/dist/server/app-render/after-task-async-storage.external.js" ***!
  \***********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/after-task-async-storage.external.js");

/***/ }),

/***/ "../app-render/work-async-storage.external":
/*!*****************************************************************************!*\
  !*** external "next/dist/server/app-render/work-async-storage.external.js" ***!
  \*****************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-async-storage.external.js");

/***/ }),

/***/ "./work-unit-async-storage.external":
/*!**********************************************************************************!*\
  !*** external "next/dist/server/app-render/work-unit-async-storage.external.js" ***!
  \**********************************************************************************/
/***/ ((module) => {

"use strict";
module.exports = require("next/dist/server/app-render/work-unit-async-storage.external.js");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdev%2Fpersona%2Froute&page=%2Fapi%2Fdev%2Fpersona%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdev%2Fpersona%2Froute.ts&appDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!":
/*!*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdev%2Fpersona%2Froute&page=%2Fapi%2Fdev%2Fpersona%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdev%2Fpersona%2Froute.ts&appDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D! ***!
  \*******************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   patchFetch: () => (/* binding */ patchFetch),\n/* harmony export */   routeModule: () => (/* binding */ routeModule),\n/* harmony export */   serverHooks: () => (/* binding */ serverHooks),\n/* harmony export */   workAsyncStorage: () => (/* binding */ workAsyncStorage),\n/* harmony export */   workUnitAsyncStorage: () => (/* binding */ workUnitAsyncStorage)\n/* harmony export */ });\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/dist/server/route-modules/app-route/module.compiled */ \"(rsc)/./node_modules/next/dist/server/route-modules/app-route/module.compiled.js\");\n/* harmony import */ var next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__);\n/* harmony import */ var next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! next/dist/server/route-kind */ \"(rsc)/./node_modules/next/dist/server/route-kind.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(/*! next/dist/server/lib/patch-fetch */ \"(rsc)/./node_modules/next/dist/server/lib/patch-fetch.js\");\n/* harmony import */ var next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__);\n/* harmony import */ var C_workspace_codebase_local_github_pa_fe_dev_src_app_api_dev_persona_route_ts__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(/*! ./src/app/api/dev/persona/route.ts */ \"(rsc)/./src/app/api/dev/persona/route.ts\");\n\n\n\n\n// We inject the nextConfigOutput here so that we can use them in the route\n// module.\nconst nextConfigOutput = \"\"\nconst routeModule = new next_dist_server_route_modules_app_route_module_compiled__WEBPACK_IMPORTED_MODULE_0__.AppRouteRouteModule({\n    definition: {\n        kind: next_dist_server_route_kind__WEBPACK_IMPORTED_MODULE_1__.RouteKind.APP_ROUTE,\n        page: \"/api/dev/persona/route\",\n        pathname: \"/api/dev/persona\",\n        filename: \"route\",\n        bundlePath: \"app/api/dev/persona/route\"\n    },\n    resolvedPagePath: \"C:\\\\workspace\\\\codebase\\\\local-github\\\\pa-fe-dev\\\\src\\\\app\\\\api\\\\dev\\\\persona\\\\route.ts\",\n    nextConfigOutput,\n    userland: C_workspace_codebase_local_github_pa_fe_dev_src_app_api_dev_persona_route_ts__WEBPACK_IMPORTED_MODULE_3__\n});\n// Pull out the exports that we need to expose from the module. This should\n// be eliminated when we've moved the other routes to the new format. These\n// are used to hook into the route.\nconst { workAsyncStorage, workUnitAsyncStorage, serverHooks } = routeModule;\nfunction patchFetch() {\n    return (0,next_dist_server_lib_patch_fetch__WEBPACK_IMPORTED_MODULE_2__.patchFetch)({\n        workAsyncStorage,\n        workUnitAsyncStorage\n    });\n}\n\n\n//# sourceMappingURL=app-route.js.map//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9ub2RlX21vZHVsZXMvbmV4dC9kaXN0L2J1aWxkL3dlYnBhY2svbG9hZGVycy9uZXh0LWFwcC1sb2FkZXIvaW5kZXguanM/bmFtZT1hcHAlMkZhcGklMkZkZXYlMkZwZXJzb25hJTJGcm91dGUmcGFnZT0lMkZhcGklMkZkZXYlMkZwZXJzb25hJTJGcm91dGUmYXBwUGF0aHM9JnBhZ2VQYXRoPXByaXZhdGUtbmV4dC1hcHAtZGlyJTJGYXBpJTJGZGV2JTJGcGVyc29uYSUyRnJvdXRlLnRzJmFwcERpcj1DJTNBJTVDd29ya3NwYWNlJTVDY29kZWJhc2UlNUNsb2NhbC1naXRodWIlNUNwYS1mZS1kZXYlNUNzcmMlNUNhcHAmcGFnZUV4dGVuc2lvbnM9dHN4JnBhZ2VFeHRlbnNpb25zPXRzJnBhZ2VFeHRlbnNpb25zPWpzeCZwYWdlRXh0ZW5zaW9ucz1qcyZyb290RGlyPUMlM0ElNUN3b3Jrc3BhY2UlNUNjb2RlYmFzZSU1Q2xvY2FsLWdpdGh1YiU1Q3BhLWZlLWRldiZpc0Rldj10cnVlJnRzY29uZmlnUGF0aD10c2NvbmZpZy5qc29uJmJhc2VQYXRoPSZhc3NldFByZWZpeD0mbmV4dENvbmZpZ091dHB1dD0mcHJlZmVycmVkUmVnaW9uPSZtaWRkbGV3YXJlQ29uZmlnPWUzMCUzRCEiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7Ozs7Ozs7QUFBK0Y7QUFDdkM7QUFDcUI7QUFDdUM7QUFDcEg7QUFDQTtBQUNBO0FBQ0Esd0JBQXdCLHlHQUFtQjtBQUMzQztBQUNBLGNBQWMsa0VBQVM7QUFDdkI7QUFDQTtBQUNBO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDQTtBQUNBLFlBQVk7QUFDWixDQUFDO0FBQ0Q7QUFDQTtBQUNBO0FBQ0EsUUFBUSxzREFBc0Q7QUFDOUQ7QUFDQSxXQUFXLDRFQUFXO0FBQ3RCO0FBQ0E7QUFDQSxLQUFLO0FBQ0w7QUFDMEY7O0FBRTFGIiwic291cmNlcyI6WyIiXSwic291cmNlc0NvbnRlbnQiOlsiaW1wb3J0IHsgQXBwUm91dGVSb3V0ZU1vZHVsZSB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL3JvdXRlLW1vZHVsZXMvYXBwLXJvdXRlL21vZHVsZS5jb21waWxlZFwiO1xuaW1wb3J0IHsgUm91dGVLaW5kIH0gZnJvbSBcIm5leHQvZGlzdC9zZXJ2ZXIvcm91dGUta2luZFwiO1xuaW1wb3J0IHsgcGF0Y2hGZXRjaCBhcyBfcGF0Y2hGZXRjaCB9IGZyb20gXCJuZXh0L2Rpc3Qvc2VydmVyL2xpYi9wYXRjaC1mZXRjaFwiO1xuaW1wb3J0ICogYXMgdXNlcmxhbmQgZnJvbSBcIkM6XFxcXHdvcmtzcGFjZVxcXFxjb2RlYmFzZVxcXFxsb2NhbC1naXRodWJcXFxccGEtZmUtZGV2XFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGRldlxcXFxwZXJzb25hXFxcXHJvdXRlLnRzXCI7XG4vLyBXZSBpbmplY3QgdGhlIG5leHRDb25maWdPdXRwdXQgaGVyZSBzbyB0aGF0IHdlIGNhbiB1c2UgdGhlbSBpbiB0aGUgcm91dGVcbi8vIG1vZHVsZS5cbmNvbnN0IG5leHRDb25maWdPdXRwdXQgPSBcIlwiXG5jb25zdCByb3V0ZU1vZHVsZSA9IG5ldyBBcHBSb3V0ZVJvdXRlTW9kdWxlKHtcbiAgICBkZWZpbml0aW9uOiB7XG4gICAgICAgIGtpbmQ6IFJvdXRlS2luZC5BUFBfUk9VVEUsXG4gICAgICAgIHBhZ2U6IFwiL2FwaS9kZXYvcGVyc29uYS9yb3V0ZVwiLFxuICAgICAgICBwYXRobmFtZTogXCIvYXBpL2Rldi9wZXJzb25hXCIsXG4gICAgICAgIGZpbGVuYW1lOiBcInJvdXRlXCIsXG4gICAgICAgIGJ1bmRsZVBhdGg6IFwiYXBwL2FwaS9kZXYvcGVyc29uYS9yb3V0ZVwiXG4gICAgfSxcbiAgICByZXNvbHZlZFBhZ2VQYXRoOiBcIkM6XFxcXHdvcmtzcGFjZVxcXFxjb2RlYmFzZVxcXFxsb2NhbC1naXRodWJcXFxccGEtZmUtZGV2XFxcXHNyY1xcXFxhcHBcXFxcYXBpXFxcXGRldlxcXFxwZXJzb25hXFxcXHJvdXRlLnRzXCIsXG4gICAgbmV4dENvbmZpZ091dHB1dCxcbiAgICB1c2VybGFuZFxufSk7XG4vLyBQdWxsIG91dCB0aGUgZXhwb3J0cyB0aGF0IHdlIG5lZWQgdG8gZXhwb3NlIGZyb20gdGhlIG1vZHVsZS4gVGhpcyBzaG91bGRcbi8vIGJlIGVsaW1pbmF0ZWQgd2hlbiB3ZSd2ZSBtb3ZlZCB0aGUgb3RoZXIgcm91dGVzIHRvIHRoZSBuZXcgZm9ybWF0LiBUaGVzZVxuLy8gYXJlIHVzZWQgdG8gaG9vayBpbnRvIHRoZSByb3V0ZS5cbmNvbnN0IHsgd29ya0FzeW5jU3RvcmFnZSwgd29ya1VuaXRBc3luY1N0b3JhZ2UsIHNlcnZlckhvb2tzIH0gPSByb3V0ZU1vZHVsZTtcbmZ1bmN0aW9uIHBhdGNoRmV0Y2goKSB7XG4gICAgcmV0dXJuIF9wYXRjaEZldGNoKHtcbiAgICAgICAgd29ya0FzeW5jU3RvcmFnZSxcbiAgICAgICAgd29ya1VuaXRBc3luY1N0b3JhZ2VcbiAgICB9KTtcbn1cbmV4cG9ydCB7IHJvdXRlTW9kdWxlLCB3b3JrQXN5bmNTdG9yYWdlLCB3b3JrVW5pdEFzeW5jU3RvcmFnZSwgc2VydmVySG9va3MsIHBhdGNoRmV0Y2gsICB9O1xuXG4vLyMgc291cmNlTWFwcGluZ1VSTD1hcHAtcm91dGUuanMubWFwIl0sIm5hbWVzIjpbXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdev%2Fpersona%2Froute&page=%2Fapi%2Fdev%2Fpersona%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdev%2Fpersona%2Froute.ts&appDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!\n");

/***/ }),

/***/ "(rsc)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(ssr)/./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true!":
/*!******************************************************************************************************!*\
  !*** ./node_modules/next/dist/build/webpack/loaders/next-flight-client-entry-loader.js?server=true! ***!
  \******************************************************************************************************/
/***/ (() => {



/***/ }),

/***/ "(rsc)/./src/app/api/dev/persona/route.ts":
/*!******************************************!*\
  !*** ./src/app/api/dev/persona/route.ts ***!
  \******************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   POST: () => (/* binding */ POST)\n/* harmony export */ });\n/* harmony import */ var next_server__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! next/server */ \"(rsc)/./node_modules/next/dist/api/server.js\");\n/* harmony import */ var _lib_persona__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! @/lib/persona */ \"(rsc)/./src/lib/persona.ts\");\n\n\n/** Dev-only persona switcher (stub auth). */ async function POST(req) {\n    const body = await req.json().catch(()=>null);\n    const id = body?.persona;\n    if (!_lib_persona__WEBPACK_IMPORTED_MODULE_1__.PERSONAS.some((p)=>p.id === id)) {\n        return next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n            title: 'Unknown persona',\n            status: 400,\n            code: 'DEV-4000'\n        }, {\n            status: 400\n        });\n    }\n    const res = next_server__WEBPACK_IMPORTED_MODULE_0__.NextResponse.json({\n        ok: true,\n        persona: id\n    });\n    res.cookies.set(_lib_persona__WEBPACK_IMPORTED_MODULE_1__.PERSONA_COOKIE, id, {\n        path: '/',\n        httpOnly: false\n    });\n    return res;\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvYXBwL2FwaS9kZXYvcGVyc29uYS9yb3V0ZS50cyIsIm1hcHBpbmdzIjoiOzs7Ozs7QUFBNkQ7QUFDSjtBQUV6RCwyQ0FBMkMsR0FDcEMsZUFBZUcsS0FBS0MsR0FBZ0I7SUFDekMsTUFBTUMsT0FBTyxNQUFNRCxJQUFJRSxJQUFJLEdBQUdDLEtBQUssQ0FBQyxJQUFNO0lBQzFDLE1BQU1DLEtBQUtILE1BQU1JO0lBQ2pCLElBQUksQ0FBQ1Asa0RBQVFBLENBQUNRLElBQUksQ0FBQyxDQUFDQyxJQUFNQSxFQUFFSCxFQUFFLEtBQUtBLEtBQUs7UUFDdEMsT0FBT1IscURBQVlBLENBQUNNLElBQUksQ0FBQztZQUFFTSxPQUFPO1lBQW1CQyxRQUFRO1lBQUtDLE1BQU07UUFBVyxHQUFHO1lBQUVELFFBQVE7UUFBSTtJQUN0RztJQUNBLE1BQU1FLE1BQU1mLHFEQUFZQSxDQUFDTSxJQUFJLENBQUM7UUFBRVUsSUFBSTtRQUFNUCxTQUFTRDtJQUFHO0lBQ3RETyxJQUFJRSxPQUFPLENBQUNDLEdBQUcsQ0FBQ2pCLHdEQUFjQSxFQUFFTyxJQUFJO1FBQUVXLE1BQU07UUFBS0MsVUFBVTtJQUFNO0lBQ2pFLE9BQU9MO0FBQ1QiLCJzb3VyY2VzIjpbIkM6XFx3b3Jrc3BhY2VcXGNvZGViYXNlXFxsb2NhbC1naXRodWJcXHBhLWZlLWRldlxcc3JjXFxhcHBcXGFwaVxcZGV2XFxwZXJzb25hXFxyb3V0ZS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJpbXBvcnQgeyBOZXh0UmVzcG9uc2UsIHR5cGUgTmV4dFJlcXVlc3QgfSBmcm9tICduZXh0L3NlcnZlcic7XG5pbXBvcnQgeyBQRVJTT05BX0NPT0tJRSwgUEVSU09OQVMgfSBmcm9tICdAL2xpYi9wZXJzb25hJztcblxuLyoqIERldi1vbmx5IHBlcnNvbmEgc3dpdGNoZXIgKHN0dWIgYXV0aCkuICovXG5leHBvcnQgYXN5bmMgZnVuY3Rpb24gUE9TVChyZXE6IE5leHRSZXF1ZXN0KTogUHJvbWlzZTxOZXh0UmVzcG9uc2U+IHtcbiAgY29uc3QgYm9keSA9IGF3YWl0IHJlcS5qc29uKCkuY2F0Y2goKCkgPT4gbnVsbCk7XG4gIGNvbnN0IGlkID0gYm9keT8ucGVyc29uYTtcbiAgaWYgKCFQRVJTT05BUy5zb21lKChwKSA9PiBwLmlkID09PSBpZCkpIHtcbiAgICByZXR1cm4gTmV4dFJlc3BvbnNlLmpzb24oeyB0aXRsZTogJ1Vua25vd24gcGVyc29uYScsIHN0YXR1czogNDAwLCBjb2RlOiAnREVWLTQwMDAnIH0sIHsgc3RhdHVzOiA0MDAgfSk7XG4gIH1cbiAgY29uc3QgcmVzID0gTmV4dFJlc3BvbnNlLmpzb24oeyBvazogdHJ1ZSwgcGVyc29uYTogaWQgfSk7XG4gIHJlcy5jb29raWVzLnNldChQRVJTT05BX0NPT0tJRSwgaWQsIHsgcGF0aDogJy8nLCBodHRwT25seTogZmFsc2UgfSk7XG4gIHJldHVybiByZXM7XG59XG4iXSwibmFtZXMiOlsiTmV4dFJlc3BvbnNlIiwiUEVSU09OQV9DT09LSUUiLCJQRVJTT05BUyIsIlBPU1QiLCJyZXEiLCJib2R5IiwianNvbiIsImNhdGNoIiwiaWQiLCJwZXJzb25hIiwic29tZSIsInAiLCJ0aXRsZSIsInN0YXR1cyIsImNvZGUiLCJyZXMiLCJvayIsImNvb2tpZXMiLCJzZXQiLCJwYXRoIiwiaHR0cE9ubHkiXSwiaWdub3JlTGlzdCI6W10sInNvdXJjZVJvb3QiOiIifQ==\n//# sourceURL=webpack-internal:///(rsc)/./src/app/api/dev/persona/route.ts\n");

/***/ }),

/***/ "(rsc)/./src/lib/persona.ts":
/*!****************************!*\
  !*** ./src/lib/persona.ts ***!
  \****************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony export */ __webpack_require__.d(__webpack_exports__, {\n/* harmony export */   DEFAULT_PERSONA: () => (/* binding */ DEFAULT_PERSONA),\n/* harmony export */   PERSONAS: () => (/* binding */ PERSONAS),\n/* harmony export */   PERSONA_COOKIE: () => (/* binding */ PERSONA_COOKIE),\n/* harmony export */   isLeader: () => (/* binding */ isLeader),\n/* harmony export */   personaById: () => (/* binding */ personaById)\n/* harmony export */ });\nconst PERSONAS = [\n    {\n        id: 'LEADER_P2',\n        agentId: 'L3001',\n        level: 'P2',\n        label: 'P2 Leader (Mei Lin)'\n    },\n    {\n        id: 'LEADER_P3',\n        agentId: 'L2001',\n        level: 'P3',\n        label: 'P3 Leader (Farid)'\n    },\n    {\n        id: 'AGENT_P4',\n        agentId: 'A1001',\n        level: 'P4',\n        label: 'P4 Agent (Aisyah)'\n    },\n    {\n        id: 'AGENT_EMPTY',\n        agentId: 'A1002',\n        level: 'P4',\n        label: 'Demo: EMPTY detail'\n    },\n    {\n        id: 'AGENT_PROCESSING',\n        agentId: 'A1003',\n        level: 'P4',\n        label: 'Demo: PROCESSING detail'\n    }\n];\nconst DEFAULT_PERSONA = 'LEADER_P2';\nconst PERSONA_COOKIE = 'pa_persona';\nfunction personaById(id) {\n    return PERSONAS.find((p)=>p.id === id) ?? PERSONAS[0];\n}\nfunction isLeader(p) {\n    return p.level !== 'P4';\n}\n//# sourceURL=[module]\n//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiKHJzYykvLi9zcmMvbGliL3BlcnNvbmEudHMiLCJtYXBwaW5ncyI6Ijs7Ozs7Ozs7QUFHTyxNQUFNQSxXQUFzQjtJQUNqQztRQUFFQyxJQUFJO1FBQWFDLFNBQVM7UUFBU0MsT0FBTztRQUFNQyxPQUFPO0lBQXNCO0lBQy9FO1FBQUVILElBQUk7UUFBYUMsU0FBUztRQUFTQyxPQUFPO1FBQU1DLE9BQU87SUFBb0I7SUFDN0U7UUFBRUgsSUFBSTtRQUFZQyxTQUFTO1FBQVNDLE9BQU87UUFBTUMsT0FBTztJQUFvQjtJQUM1RTtRQUFFSCxJQUFJO1FBQWVDLFNBQVM7UUFBU0MsT0FBTztRQUFNQyxPQUFPO0lBQXFCO0lBQ2hGO1FBQUVILElBQUk7UUFBb0JDLFNBQVM7UUFBU0MsT0FBTztRQUFNQyxPQUFPO0lBQTBCO0NBQzNGLENBQUM7QUFDSyxNQUFNQyxrQkFBNkIsWUFBWTtBQUMvQyxNQUFNQyxpQkFBaUIsYUFBYTtBQUVwQyxTQUFTQyxZQUFZTixFQUFzQjtJQUNoRCxPQUFPRCxTQUFTUSxJQUFJLENBQUMsQ0FBQ0MsSUFBTUEsRUFBRVIsRUFBRSxLQUFLQSxPQUFPRCxRQUFRLENBQUMsRUFBRTtBQUN6RDtBQUNPLFNBQVNVLFNBQVNELENBQVU7SUFBYSxPQUFPQSxFQUFFTixLQUFLLEtBQUs7QUFBTSIsInNvdXJjZXMiOlsiQzpcXHdvcmtzcGFjZVxcY29kZWJhc2VcXGxvY2FsLWdpdGh1YlxccGEtZmUtZGV2XFxzcmNcXGxpYlxccGVyc29uYS50cyJdLCJzb3VyY2VzQ29udGVudCI6WyJleHBvcnQgdHlwZSBQZXJzb25hSWQgPSAnQUdFTlRfUDQnIHwgJ0FHRU5UX0VNUFRZJyB8ICdBR0VOVF9QUk9DRVNTSU5HJyB8ICdMRUFERVJfUDMnIHwgJ0xFQURFUl9QMic7XG5leHBvcnQgaW50ZXJmYWNlIFBlcnNvbmEgeyBpZDogUGVyc29uYUlkOyBhZ2VudElkOiBzdHJpbmc7IGxldmVsOiAnUDInIHwgJ1AzJyB8ICdQNCc7IGxhYmVsOiBzdHJpbmcgfVxuXG5leHBvcnQgY29uc3QgUEVSU09OQVM6IFBlcnNvbmFbXSA9IFtcbiAgeyBpZDogJ0xFQURFUl9QMicsIGFnZW50SWQ6ICdMMzAwMScsIGxldmVsOiAnUDInLCBsYWJlbDogJ1AyIExlYWRlciAoTWVpIExpbiknIH0sXG4gIHsgaWQ6ICdMRUFERVJfUDMnLCBhZ2VudElkOiAnTDIwMDEnLCBsZXZlbDogJ1AzJywgbGFiZWw6ICdQMyBMZWFkZXIgKEZhcmlkKScgfSxcbiAgeyBpZDogJ0FHRU5UX1A0JywgYWdlbnRJZDogJ0ExMDAxJywgbGV2ZWw6ICdQNCcsIGxhYmVsOiAnUDQgQWdlbnQgKEFpc3lhaCknIH0sXG4gIHsgaWQ6ICdBR0VOVF9FTVBUWScsIGFnZW50SWQ6ICdBMTAwMicsIGxldmVsOiAnUDQnLCBsYWJlbDogJ0RlbW86IEVNUFRZIGRldGFpbCcgfSxcbiAgeyBpZDogJ0FHRU5UX1BST0NFU1NJTkcnLCBhZ2VudElkOiAnQTEwMDMnLCBsZXZlbDogJ1A0JywgbGFiZWw6ICdEZW1vOiBQUk9DRVNTSU5HIGRldGFpbCcgfSxcbl07XG5leHBvcnQgY29uc3QgREVGQVVMVF9QRVJTT05BOiBQZXJzb25hSWQgPSAnTEVBREVSX1AyJztcbmV4cG9ydCBjb25zdCBQRVJTT05BX0NPT0tJRSA9ICdwYV9wZXJzb25hJztcblxuZXhwb3J0IGZ1bmN0aW9uIHBlcnNvbmFCeUlkKGlkOiBzdHJpbmcgfCB1bmRlZmluZWQpOiBQZXJzb25hIHtcbiAgcmV0dXJuIFBFUlNPTkFTLmZpbmQoKHApID0+IHAuaWQgPT09IGlkKSA/PyBQRVJTT05BU1swXSE7XG59XG5leHBvcnQgZnVuY3Rpb24gaXNMZWFkZXIocDogUGVyc29uYSk6IGJvb2xlYW4geyByZXR1cm4gcC5sZXZlbCAhPT0gJ1A0JzsgfVxuIl0sIm5hbWVzIjpbIlBFUlNPTkFTIiwiaWQiLCJhZ2VudElkIiwibGV2ZWwiLCJsYWJlbCIsIkRFRkFVTFRfUEVSU09OQSIsIlBFUlNPTkFfQ09PS0lFIiwicGVyc29uYUJ5SWQiLCJmaW5kIiwicCIsImlzTGVhZGVyIl0sImlnbm9yZUxpc3QiOltdLCJzb3VyY2VSb290IjoiIn0=\n//# sourceURL=webpack-internal:///(rsc)/./src/lib/persona.ts\n");

/***/ })

};
;

// load runtime
var __webpack_require__ = require("../../../../webpack-runtime.js");
__webpack_require__.C(exports);
var __webpack_exec__ = (moduleId) => (__webpack_require__(__webpack_require__.s = moduleId))
var __webpack_exports__ = __webpack_require__.X(0, ["vendor-chunks/next"], () => (__webpack_exec__("(rsc)/./node_modules/next/dist/build/webpack/loaders/next-app-loader/index.js?name=app%2Fapi%2Fdev%2Fpersona%2Froute&page=%2Fapi%2Fdev%2Fpersona%2Froute&appPaths=&pagePath=private-next-app-dir%2Fapi%2Fdev%2Fpersona%2Froute.ts&appDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev%5Csrc%5Capp&pageExtensions=tsx&pageExtensions=ts&pageExtensions=jsx&pageExtensions=js&rootDir=C%3A%5Cworkspace%5Ccodebase%5Clocal-github%5Cpa-fe-dev&isDev=true&tsconfigPath=tsconfig.json&basePath=&assetPrefix=&nextConfigOutput=&preferredRegion=&middlewareConfig=e30%3D!")));
module.exports = __webpack_exports__;

})();