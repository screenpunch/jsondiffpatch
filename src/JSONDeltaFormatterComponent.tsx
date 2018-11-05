import * as React from "react";

import {Delta} from "jsondiffpatch";

import JSONFormatterComponent, { Indent, OwnProps as JSONComponentProps, PropertyName, Value } from "./JSONFormatterComponent";
import styled from "styled-components";

// https://benjamine.github.io/jsondiffpatch/demo/index.html?

// From BaseFormatter
const arrayKeyToSortNumber = (key: string) => {
    if (key === '_t') {
        return -1;
    } else {
        if (key.substr(0, 1) === '_') {
            return parseInt(key.slice(1), 10);
        } else {
            return parseInt(key, 10) + 0.1;
        }
    }
};

// From BaseFormatter
const arrayKeyCompare = (key1: any, key2: any) => arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);

// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
// TODO: Move to Util class
const toType = (obj: any) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

const getDeltaType = (delta: any, movedFrom: any) => {

    if (delta === undefined) {
        if (movedFrom) {
            return 'movedestination';
        }

        return "unchanged";
    }

    const typeOf = toType(delta);

    if (typeOf === "array") {
        if (delta.length === 1) {
            return 'added';
        }
        if (delta.length === 2) {
            return 'modified';
        }
        if (delta.length === 3 && delta[2] === 0) {
            return 'deleted';
        }
        if (delta.length === 3 && delta[2] === 2) {
            return 'textdiff';
        }
        if (delta.length === 3 && delta[2] === 3) {
            return 'moved';
        }

    } else if (typeOf === 'object') {

        // delta being an object indicates that that there are children with deltas
        return 'node';
    }

    return "unchanged";
}

type DeltaRendererProps = {
    propertyName: string;
    delta?: any[];
    data?: any;
}


const JSONAddedComponent = styled<JSONComponentProps>(props => <JSONFormatterComponent {...props} />)`

  & > ${PropertyName},
  & > ${Indent},
  & > ${Value} {
    background-color: #bbffbb;
  }
`;

const JSONDeletedComponent = styled<JSONComponentProps>(props => <JSONFormatterComponent {...props} />)`

  text-decoration: line-through;
  
  & > ${PropertyName},
  & > ${Indent},
  & > ${Value} {
    background-color: #ffbbbb;
  }
`;

const JSONUnchangedComponent = styled<JSONComponentProps>(props => <JSONFormatterComponent {...props} />)`
  
  /* TODO
  color: #c6c6c6;
  & > ${PropertyName} {
    color: #8d8d8d !important;
  }
  */
`;

const Unchanged = (props: DeltaRendererProps) => {

    const {data, propertyName} = props;

    const json = {};
    json[propertyName] = data;

    return <JSONUnchangedComponent json={json} />;
}

const Added: React.SFC<DeltaRendererProps> = props => {

    const {delta, propertyName} = props;

    const value = delta && delta[0];
    const json = {};

    json[propertyName] = value;

    return <JSONAddedComponent json={json} />;
}

const Deleted: React.SFC<DeltaRendererProps> = props => {

    const {delta, propertyName} = props;
    const value = delta && delta[0];

    const json = {};

    json[propertyName] = value;

    return <JSONDeletedComponent json={json} />
}

const RequiredNode = (props: DeltaRendererProps & { showUnchangedValues: boolean }) => {
    const { data, delta, propertyName, showUnchangedValues } = props;
    return (
        <Indent>
            <PropertyName>{propertyName}</PropertyName>
            <JSONDeltaFormatterComponent
                json={data}
                delta={delta}
                showUnchangedValues={showUnchangedValues}
            />
        </Indent>
    );
}

const Moved = (props: DeltaRendererProps) => {

    const {delta, propertyName} = props;
    const value = delta && delta[1];

    return (
        <Indent>
            <PropertyName>{propertyName}</PropertyName>
            <span style={{backgroundColor: '#ffffbb'}}>
                => {value}
            </span>
        </Indent>
    );
}

const MoveDestination = (props: DeltaRendererProps) => {

    const {propertyName} = props;
    // const value = delta && delta[1];

    return (
        <Indent>
            <PropertyName>{propertyName}</PropertyName>
            <span style={{backgroundColor: '#ffffbb'}}>
                => Moved
            </span>
        </Indent>
    );
}

const Modified = (props: DeltaRendererProps) => {

    const { delta, propertyName } = props;

    const leftValue = delta && delta[0];
    const rightValue = delta && delta[1];

    return (
        <Indent>
            <PropertyName>{propertyName}</PropertyName>
            <span
                style={{
                    backgroundColor: '#ffbbbb',
                    textDecoration: "line-through"
                }}
            >
                {leftValue}
            </span>
            {" "}
            <span
                style={{backgroundColor: '#bbffbb'}}
            >
                {rightValue}
            </span>
        </Indent>
    );
}

// TODO: Improve TestDiff formatting see, jsondiffpatch html formatter
// @see https://github.com/benjamine/jsondiffpatch/blob/master/src/formatters/html.js#L12
const TextDiff = (props: DeltaRendererProps) => {
    const { delta, propertyName } = props;
    const value = delta && delta[0];

    return (
        <Indent>
            <PropertyName>{propertyName}</PropertyName>
            <span style={{backgroundColor: '#cccccc'}}>
                {value}
            </span>
        </Indent>
    );
}

const JSONDeltaFormatterComponent: React.SFC<{ json: object, delta: Delta | undefined, showUnchangedValues: boolean }> = (props) => {

    const { json, delta, showUnchangedValues } = props;

    let keys: string[] = Object.keys(json);
    let deltaKeys: string[];
    let moveDestinations: { [toIndex: string]: { fromIndex: string, fromValue: any }; };
    let deltaType: string;

    // Create a combined list of keys from the original json and the delta.
    // These are used to build a list of added, removed and moved (Array) items
    if (delta) {

        //
        moveDestinations = {};
        deltaKeys = Object.keys(delta);

        // Combine and remove duplicates
        keys = keys.concat(deltaKeys);
        keys = keys.filter((item, i) => keys.indexOf(item) === i);

        // https://github.com/benjamine/jsondiffpatch/blob/master/docs/deltas.md#array-with-inner-changes
        const indexOfT = keys.indexOf("_t");
        if (indexOfT >= 0) {

            keys.splice(indexOfT, 1);

            // Sort Array indices numerically
            keys = keys.sort(arrayKeyCompare);
        } else {
            // Sort Object keys alphabetically
            keys = keys.sort();
        }

        // Based on https://github.com/benjamine/jsondiffpatch/blob/master/src/formatters/base.js#L154
        // Create a mapping to track moved items
        deltaKeys.forEach(fromIndex => {

            const deltaValue = delta[fromIndex];
            deltaType = getDeltaType(deltaValue, undefined);

            if (deltaType === "moved") {

                // Mapped by the to destination, substr removed the leading _
                moveDestinations[deltaValue[1].toString()] = {
                    fromIndex,
                    fromValue: json[parseInt(fromIndex.substr(1))]
                }
            }
        });
    }

    //
    const renderers = keys.map(key => {

        const movedFrom = moveDestinations && moveDestinations[key];

        const objectData = movedFrom ? movedFrom.fromValue : json[key];
        const objectDelta = delta && delta[key];

        deltaType = getDeltaType(objectDelta, movedFrom);

        const rendererProps = {
            key,
            propertyName: key,
            delta: objectDelta
        };

        switch (deltaType) {
            case "added":
                return <Added {...rendererProps} />;

            case "deleted":
                return <Deleted {...rendererProps} />;

            case "moved":
                return <Moved {...rendererProps} />;

            case "modified":
                return <Modified {...rendererProps} />;

            case "textdiff":
                return <TextDiff {...rendererProps} />;

            case "node":
                return (
                    <RequiredNode
                        {...rendererProps}
                        data={objectData}
                        showUnchangedValues={showUnchangedValues}
                    />
                );

            case "movedestination":
                return <MoveDestination {...rendererProps} />;

            case "unchanged":
                return showUnchangedValues && (
                    <Unchanged
                        {...rendererProps}
                        data={objectData}
                    />
                );

            default:
                return null;
        }
    });

    return renderers && <>{renderers}</>;
};

export default JSONDeltaFormatterComponent;