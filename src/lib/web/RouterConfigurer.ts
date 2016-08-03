import * as _ from "lodash";
import { Router } from "express-serve-static-core";
import { OrderUtil } from "../decorators/OrderDecorator";
import { Interceptor } from "../decorators/InterceptorDecorator";
import { RouterConfigItem } from "../decorators/RequestMappingDecorator";

/**
 * RouteConfigurer responsible for configuring the Express 4.x router that will be exposed by the dispatcher.
 * */
export class RouterConfigurer {

    private router: Router;
    private interceptors: Array<any>;
    private routeHandlers: Map<RouterConfigItem, any>;

    constructor (router: Router) {
        this.router = router;
        this.interceptors = [];
        this.routeHandlers = new Map();
    }

    /**
     * Registers an interceptor.
     * @param instance instance of the interceptor
     * */
    registerInterceptor(instance: Interceptor) {
        this.interceptors.push(instance);
    }

    /**
     * Registers new route handler for the given route.
     * @param route the route configuration
     * @param handler the instance responsible for handling the route
     * */
    registerHandler(route: RouterConfigItem, handler) {
        console.log(`Registering route. Path: '${route.requestConfig.path}', method: ${route.requestConfig.method}.`);
        this.router[route.requestConfig.method](route.requestConfig.path, this.wrap(async (request, response, next) => {
            let result = await handler[route.methodHandler](request, response);
            // TODO #3 saskodh: Check whether is more convenient to store in the request zone or pass on next
            response.$$frameworkData = {
                view: route.view,
                model: result
            };
            next();
        }));
    }

    /**
     * Configures the Express router with the given interceptors and route handlers.
     * Note: this method needs to be called after all interceptors and route handlers have been registered.
     * */
    configure() {
        this.interceptors = OrderUtil.orderList(this.interceptors);
        this.configureMiddlewares();
    }

    private configureMiddlewares() {
        // TODO #28: bug route handlers are still executed before preHandlers
        this.router.use(this.wrap(this.preHandler.bind(this)));
        // NOTE: we will have our middleware handler when we drop the dependency to express
        // That would require the dispatching by path to be implemented on our side
        this.registerRouteHandlers();
        this.router.use(this.wrap(this.postHandler.bind(this)));
        this.router.use(this.resolver.bind(this));
    }

    private registerRouteHandlers() {
        for (let [route, handler] of this.routeHandlers.entries()) {
            let httpMethod = route.requestConfig.method;
            let path = route.requestConfig.path;

            // console.log(`Registering route. Path: '${path}', method: ${httpMethod}.`);
            this.router[httpMethod](path, this.wrap(async(request, response, next) => {
                let result = await handler[route.methodHandler](request, response);
                // TODO #3 saskodh: Check whether is more convenient to store in the request zone or pass on next
                response.$$frameworkData = {
                    view: route.view,
                    model: result
                };
                next();
            }));
        }
    }

    private async preHandler(request, response, next) {
        for (let i = 0; i < this.interceptors.length; i += 1) {
            let interceptor = this.interceptors[i];
            if (_.isFunction(interceptor.preHandle)) {
                await interceptor.preHandle(request, response);
            }
        }
        next();
    }

    private async postHandler(request, response, next) {
        // NOTE: postHandle is executed in the reversed order
        for (let i = this.interceptors.length - 1; i >= 0; i -= 1) {
            let interceptor = this.interceptors[i];
            if (_.isFunction(interceptor.postHandle)) {
                await interceptor.postHandle(request, response);
            }
        }
        next();
    }

    private resolver(request, response) {
        let handlingResult = response.$$frameworkData;
        if (handlingResult) {
            if (_.isUndefined(handlingResult.view)) {
                response.json(handlingResult.model);
            } else {
                response.render(handlingResult.view, handlingResult.model);
            }
        }
    }

    // TODO saskodh: replace this workaround when we upgrade express to 5.x
    // NOTE: workaround because express 4.x does not support middle-wares returning promise
    private wrap(fn) {
        return (...args) => fn(...args).catch(args[2]);
    };
}