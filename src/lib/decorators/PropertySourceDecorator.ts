import * as _ from "lodash";
import { ConfigurationUtil } from "./ConfigurationDecorator";
import { GeneralUtils } from "../helpers/GeneralUtils";

/**
 * A decorator for defining a JSON property source for the configuration properties.
 * May only be put on @Configuration() classes.
 * @param path to the property source. (For relative paths use __dirname)
 */
export function PropertySource(path: string) {
    return function (target) {
        if (!ConfigurationUtil.isConfigurationClass(target)) {
            throw new Error('@PropertySource can be used only on @Configuration classes.');
        }
        ConfigurationUtil.addPropertySourcePath(target, path);
    };
}

export class PropertySourceUtil {

    static getPropertiesFromPaths(...propertySourcePaths: Array<string>): Map<string, string> {
        let resultPropertiesMap = new Map<string, string>();
        for (let path of propertySourcePaths) {
            console.log(`Loading properties by @PropertySource from "${path}"`);
            let properties = require(path);
            this.parseProperties(properties).forEach((value, prop) => resultPropertiesMap.set(prop, value));
        }
        return resultPropertiesMap;
    }

    private static parseProperties(properties): Map<string, string> {
        if (_.isObject(properties)) {
            return GeneralUtils.flattenObject(properties);
        }
        return new Map();
    }
}