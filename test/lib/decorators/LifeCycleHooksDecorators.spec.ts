import {expect} from "chai";
import {
    Component
} from "../../../src/lib/decorators/ComponentDecorator";
import {
    PostConstruct, LifeCycleHooksUtil, PreDestroy
} from "../../../src/lib/decorators/LifeCycleHooksDecorators";
import { DecoratorUsageError } from "../../../src/lib/errors/DecoratorUsageError";

describe('PostConstructDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {
            @PostConstruct()
            init () {} // tslint:disable-line
        }

        // when
        let config = LifeCycleHooksUtil.getConfig(A);

        // then
        expect(config.postConstructMethod).to.eql('init');
        expect(config.preDestroyMethod).to.be.undefined;
    });

    it('should throw error if @PostConstruct is used on more than one method', function () {
        // given
        let createComponent = () => {
            @Component()
            class A {
                @PostConstruct()
                init() {} // tslint:disable-line

                @PostConstruct()
                initTwo() {} // tslint:disable-line
            }
        };

        // when / then
        expect(createComponent).to.throw(DecoratorUsageError);
    });
});

describe('PreDestroyDecorator', function () {

    it('should add metadata', function () {
        // given
        @Component()
        class A {
            @PreDestroy()
            destroy () {} // tslint:disable-line
        }

        // when
        let config = LifeCycleHooksUtil.getConfig(A);

        // then
        expect(config.preDestroyMethod).to.eql('destroy');
        expect(config.postConstructMethod).to.be.undefined;
    });

    it('should throw error if @PreDestroy is used on more than one method', function () {
        // given
        let createComponent = () => {
            @Component()
            class A {
                @PreDestroy()
                destroy() {} // tslint:disable-line

                @PreDestroy()
                destroy2() {} // tslint:disable-line
            }
        };

        // when / then
        expect(createComponent).to.throw(DecoratorUsageError);
    });
});