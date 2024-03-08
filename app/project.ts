// To parse this data:
//
//   import { Convert } from "./file";
//
//   const project = Convert.toProject(json);
//
// These functions will throw an error if the JSON doesn't
// match the expected interface, even if the JSON is valid.

export interface Project {
    Id: number;
    Description: string;
    LiftObject: LiftObject;
    Rigging: Rigging;
    Operations: Operation[];
}

export interface LiftObject {
    Dimensions: Dimensions;
    Weight: Weight;
    CogBox: CogBox;
    Position: Position;
    LiftPoints: LiftPoint[];
}

export interface CogBox {
    Position: Position;
    Dimensions: Dimensions;
}

export interface Dimensions {
    Length: number;
    Height: number;
    Width: number;
}

export interface Position {
    X: number;
    Y: number;
    Z: number;
}

export interface LiftPoint {
    Id: number;
    Position: Position;
}

export interface Weight {
    Mass: number;
    Factor: number;
}

export interface Operation {
    Id: number;
    Location: number;
}

export interface Rigging {
    Hooks: Hook[];
}

export interface Hook {
    Id: number;
    Position: Position;
    Legs: Leg[];
}

export interface Leg {
    Id: number;
    HookId: number;
    LiftPointId: number;
}

// Converts JSON strings to/from your types
// and asserts the results of JSON.parse at runtime
export class Convert {
    public static toProject(json: string): Project[] {
        return cast(JSON.parse(json), a(r("Project")));
    }

    public static projectToJson(value: Project[]): string {
        return JSON.stringify(uncast(value, a(r("Project"))), null, 2);
    }
}

function invalidValue(typ: any, val: any, key: any, parent: any = ''): never {
    const prettyTyp = prettyTypeName(typ);
    const parentText = parent ? ` on ${parent}` : '';
    const keyText = key ? ` for key "${key}"` : '';
    throw Error(`Invalid value${keyText}${parentText}. Expected ${prettyTyp} but got ${JSON.stringify(val)}`);
}

function prettyTypeName(typ: any): string {
    if (Array.isArray(typ)) {
        if (typ.length === 2 && typ[0] === undefined) {
            return `an optional ${prettyTypeName(typ[1])}`;
        } else {
            return `one of [${typ.map(a => { return prettyTypeName(a); }).join(", ")}]`;
        }
    } else if (typeof typ === "object" && typ.literal !== undefined) {
        return typ.literal;
    } else {
        return typeof typ;
    }
}

function jsonToJSProps(typ: any): any {
    if (typ.jsonToJS === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.json] = { key: p.js, typ: p.typ });
        typ.jsonToJS = map;
    }
    return typ.jsonToJS;
}

function jsToJSONProps(typ: any): any {
    if (typ.jsToJSON === undefined) {
        const map: any = {};
        typ.props.forEach((p: any) => map[p.js] = { key: p.json, typ: p.typ });
        typ.jsToJSON = map;
    }
    return typ.jsToJSON;
}

function transform(val: any, typ: any, getProps: any, key: any = '', parent: any = ''): any {
    function transformPrimitive(typ: string, val: any): any {
        if (typeof typ === typeof val) return val;
        return invalidValue(typ, val, key, parent);
    }

    function transformUnion(typs: any[], val: any): any {
        // val must validate against one typ in typs
        const l = typs.length;
        for (let i = 0; i < l; i++) {
            const typ = typs[i];
            try {
                return transform(val, typ, getProps);
            } catch (_) { }
        }
        return invalidValue(typs, val, key, parent);
    }

    function transformEnum(cases: string[], val: any): any {
        if (cases.indexOf(val) !== -1) return val;
        return invalidValue(cases.map(a => { return l(a); }), val, key, parent);
    }

    function transformArray(typ: any, val: any): any {
        // val must be an array with no invalid elements
        if (!Array.isArray(val)) return invalidValue(l("array"), val, key, parent);
        return val.map(el => transform(el, typ, getProps));
    }

    function transformDate(val: any): any {
        if (val === null) {
            return null;
        }
        const d = new Date(val);
        if (isNaN(d.valueOf())) {
            return invalidValue(l("Date"), val, key, parent);
        }
        return d;
    }

    function transformObject(props: { [k: string]: any }, additional: any, val: any): any {
        if (val === null || typeof val !== "object" || Array.isArray(val)) {
            return invalidValue(l(ref || "object"), val, key, parent);
        }
        const result: any = {};
        Object.getOwnPropertyNames(props).forEach(key => {
            const prop = props[key];
            const v = Object.prototype.hasOwnProperty.call(val, key) ? val[key] : undefined;
            result[prop.key] = transform(v, prop.typ, getProps, key, ref);
        });
        Object.getOwnPropertyNames(val).forEach(key => {
            if (!Object.prototype.hasOwnProperty.call(props, key)) {
                result[key] = transform(val[key], additional, getProps, key, ref);
            }
        });
        return result;
    }

    if (typ === "any") return val;
    if (typ === null) {
        if (val === null) return val;
        return invalidValue(typ, val, key, parent);
    }
    if (typ === false) return invalidValue(typ, val, key, parent);
    let ref: any = undefined;
    while (typeof typ === "object" && typ.ref !== undefined) {
        ref = typ.ref;
        typ = typeMap[typ.ref];
    }
    if (Array.isArray(typ)) return transformEnum(typ, val);
    if (typeof typ === "object") {
        return typ.hasOwnProperty("unionMembers") ? transformUnion(typ.unionMembers, val)
            : typ.hasOwnProperty("arrayItems") ? transformArray(typ.arrayItems, val)
                : typ.hasOwnProperty("props") ? transformObject(getProps(typ), typ.additional, val)
                    : invalidValue(typ, val, key, parent);
    }
    // Numbers can be parsed by Date but shouldn't be.
    if (typ === Date && typeof val !== "number") return transformDate(val);
    return transformPrimitive(typ, val);
}

function cast<T>(val: any, typ: any): T {
    return transform(val, typ, jsonToJSProps);
}

function uncast<T>(val: T, typ: any): any {
    return transform(val, typ, jsToJSONProps);
}

function l(typ: any) {
    return { literal: typ };
}

function a(typ: any) {
    return { arrayItems: typ };
}

function u(...typs: any[]) {
    return { unionMembers: typs };
}

function o(props: any[], additional: any) {
    return { props, additional };
}

function m(additional: any) {
    return { props: [], additional };
}

function r(name: string) {
    return { ref: name };
}

const typeMap: any = {
    "Project": o([
        { json: "Id", js: "Id", typ: 0 },
        { json: "Description", js: "Description", typ: "" },
        { json: "LiftObject", js: "LiftObject", typ: r("LiftObject") },
        { json: "Rigging", js: "Rigging", typ: r("Rigging") },
        { json: "Operations", js: "Operations", typ: a(r("Operation")) },
    ], false),
    "LiftObject": o([
        { json: "Dimensions", js: "Dimensions", typ: r("Dimensions") },
        { json: "Weight", js: "Weight", typ: r("Weight") },
        { json: "CogBox", js: "CogBox", typ: r("CogBox") },
        { json: "LiftPoints", js: "LiftPoints", typ: a(r("LiftPoint")) },
    ], false),
    "CogBox": o([
        { json: "Position", js: "Position", typ: r("Position") },
        { json: "Dimensions", js: "Dimensions", typ: r("Dimensions") },
    ], false),
    "Dimensions": o([
        { json: "Length", js: "Length", typ: 3.14 },
        { json: "Height", js: "Height", typ: 3.14 },
        { json: "Width", js: "Width", typ: 3.14 },
    ], false),
    "Position": o([
        { json: "X", js: "X", typ: 0 },
        { json: "Y", js: "Y", typ: 0 },
        { json: "Z", js: "Z", typ: 0 },
    ], false),
    "LiftPoint": o([
        { json: "Id", js: "Id", typ: 0 },
        { json: "Position", js: "Position", typ: r("Position") },
    ], false),
    "Weight": o([
        { json: "Mass", js: "Mass", typ: 0 },
        { json: "Factor", js: "Factor", typ: 3.14 },
    ], false),
    "Operation": o([
        { json: "Id", js: "Id", typ: 0 },
        { json: "Location", js: "Location", typ: 0 },
    ], false),
    "Rigging": o([
        { json: "Hooks", js: "Hooks", typ: a(r("Hook")) },
    ], false),
    "Hook": o([
        { json: "Id", js: "Id", typ: 0 },
        { json: "Position", js: "Position", typ: r("Position") },
        { json: "Legs", js: "Legs", typ: a(r("Leg")) },
    ], false),
    "Leg": o([
        { json: "Id", js: "Id", typ: 0 },
        { json: "HookId", js: "HookId", typ: 0 },
        { json: "LiftPointId", js: "LiftPointId", typ: 0 },
    ], false),
};
