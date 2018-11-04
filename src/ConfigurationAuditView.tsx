import "jsondiffpatch/dist/formatters-styles/html.css"

import * as React from "react";

import { Delta, DiffPatcher } from "jsondiffpatch";

import styled from "styled-components";

interface OwnProps {
    className?: string;
}

// https://benjamine.github.io/jsondiffpatch/demo/index.html?
// https://github.com/kpdecker/jsdiff
// https://github.com/flitbit/diff

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

const isArray = typeof Array.isArray === 'function' ? Array.isArray : (a: any) => a instanceof Array;

// From BaseFormatter
const arrayKeyCompare = (key1: any, key2: any) => arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);

const Name = styled.span`
  margin-right: 0.5rem;
  color: black;
  font-weight: 600;
  text-transform: capitalize;
  ::after {
    content: ":";
  }
`;

type DeltaRendererProps = {
    propertyName: string;
    delta?: any[];
    data?: any;
}

// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
const toType = (obj: any) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

const ValueRenderer: React.SFC<{ json: any, style?: {} }> = (props) => {

    const { json, style } = props;
    const typeOfSource = toType(json);

    let result = null;

    if (typeOfSource === "object" || typeOfSource === "array") {

        const keys: string[] = Object.keys(json);
        result = keys.map(key => {

            const value = json[key];
            const typeOfValue = toType(value);
            const shouldRecurseValue = typeOfValue === "object" || typeOfValue === "array";

            // TODO: We could format & style the <>{value}</> based on it's type
            return (
                <div key={key} className="line" style={style}>
                    <Name>{key}</Name>
                    {shouldRecurseValue ? <ValueRenderer json={value} /> : <>{`${value}`}</>}
                </div>
            );
        });
    }

    return result && <>{result}</>;
};

const Unchanged = (props: DeltaRendererProps) => {

    const { data, propertyName } = props;

    const json = {};
    json[propertyName] = data;

    return <i><ValueRenderer json={json} /></i>;
}

const Added = (props: DeltaRendererProps) => {

    const { delta, propertyName } = props;

    const value = delta && delta[0];
    const json = {};

    json[propertyName] = value;

    return <ValueRenderer style={{backgroundColor: "#bbffbb"}} json={json} />
}

const Deleted = (props: DeltaRendererProps) => {

    const { delta, propertyName } = props;
    const value = delta && delta[0];

    const json = {};

    json[propertyName] = value;

    return <ValueRenderer style={{display: "block", backgroundColor: '#ffbbbb', textDecoration: "line-through"}} json={json} />;
}

const RequiredNode = (props: DeltaRendererProps & { showUnchangedValues: boolean }) => {

    const { data, delta, propertyName, showUnchangedValues } = props;

    return (
        <div className="line">
            <Name>{propertyName}</Name>
            <JSONDeltaComponent
                json={data}
                delta={delta}
                showUnchangedValues={showUnchangedValues}
            />
        </div>
    );
}

const Moved = (props: DeltaRendererProps) => {

    const { delta, propertyName } = props;
    const value = delta && delta[1];

    return (
        <div className="line">
            <Name>{propertyName}</Name>
            <span style={{backgroundColor: '#ffffbb'}}>
                => {value}
            </span>
        </div>
    );
}

const MoveDestination = (props: DeltaRendererProps) => {

    const { propertyName } = props;
    // const value = delta && delta[1];

    return (
        <div className="line">
            <Name>{propertyName}</Name>
            <span style={{backgroundColor: '#ffffbb'}}>
                => Moved
            </span>
        </div>
    );
}

const Modified = (props: DeltaRendererProps) => {

    const { delta, propertyName } = props;

    const leftValue = delta && delta[0];
    const rightValue = delta && delta[1];

    return (
        <div className="line">
            <Name>{propertyName}</Name>
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
        </div>
    );
}

const TextDiff = (props: DeltaRendererProps) => {
    const { delta, propertyName } = props;
    let value = delta && delta[0];

    return (
        <div className="line">
            <Name>{propertyName}</Name>
            <span style={{backgroundColor: '#cccccc'}}>
                {value}
            </span>
        </div>
    );
}

const getDeltaType = (delta: any, movedFrom: any) => {

    if (delta === undefined) {
        if (movedFrom) {
            return 'movedestination';
        }

        return "unchanged";
    }

    if (isArray(delta)) {
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

    } else if (typeof delta === 'object') {

        // delta being an object indicates that that there are children with deltas
        return 'node';
    }

    return "unchanged";
}

const JSONDeltaComponent: React.SFC<{ json: object, delta: Delta | undefined, showUnchangedValues: boolean }> = (props) => {

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

const StyledHighlightedJSON = styled.div`
  flex: 1;
  background: #f2f2f2;
  padding: 2rem;
  margin: 2rem;
  // first line not indented 
  & > .line {
    margin-left: 0;
  }
  
  .line {
    margin-left: 1rem;
  }
`

class ConfigurationAuditView extends React.Component<OwnProps, {}>{

    public render(): React.ReactNode {

        const jsondiffpatch = new DiffPatcher({
            objectHash: (obj: any) => obj.name
        });

        let delta: Delta | undefined;

        let before: object;
        let after: object;

        before = {
            "name": "South America",
            "summary": "South America (Spanish: América del Sur, Sudamérica or  \nSuramérica; Portuguese: América do Sul; Quechua and Aymara:  \nUrin Awya Yala; Guarani: Ñembyamérika; Dutch: Zuid-Amerika;  \nFrench: Amérique du Sud) is a continent situated in the  \nWestern Hemisphere, mostly in the Southern Hemisphere, with  \na relatively small portion in the Northern Hemisphere.  \nThe continent is also considered a subcontinent of the  \nAmericas.[2][3] It is bordered on the west by the Pacific  \nOcean and on the north and east by the Atlantic Ocean;  \nNorth America and the Caribbean Sea lie to the northwest.  \nIt includes twelve countries: Argentina, Bolivia, Brazil,  \nChile, Colombia, Ecuador, Guyana, Paraguay, Peru, Suriname,  \nUruguay, and Venezuela. The South American nations that  \nborder the Caribbean Sea—including Colombia, Venezuela,  \nGuyana, Suriname, as well as French Guiana, which is an  \noverseas region of France—are also known as Caribbean South  \nAmerica. South America has an area of 17,840,000 square  \nkilometers (6,890,000 sq mi). Its population as of 2005  \nhas been estimated at more than 371,090,000. South America  \nranks fourth in area (after Asia, Africa, and North America)  \nand fifth in population (after Asia, Africa, Europe, and  \nNorth America). The word America was coined in 1507 by  \ncartographers Martin Waldseemüller and Matthias Ringmann,  \nafter Amerigo Vespucci, who was the first European to  \nsuggest that the lands newly discovered by Europeans were  \nnot India, but a New World unknown to Europeans.",
            "surface": 17840000,
            "timezone": [
                -4,
                -2
            ],
            "demographics": {
                "population": 385742554,
                "largestCities": [
                    "São Paulo",
                    "Buenos Aires",
                    "Rio de Janeiro",
                    "Lima",
                    "Bogotá"
                ]
            },
            "languages": [
                "spanish",
                "portuguese",
                "english",
                "dutch",
                "french",
                "quechua",
                "guaraní",
                "aimara",
                "mapudungun"
            ],
            "countries": [
                {
                    "name": "Argentina",
                    "capital": "Buenos Aires",
                    "independence": "1816-07-08T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Bolivia",
                    "capital": "La Paz",
                    "independence": "1825-08-05T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Brazil",
                    "capital": "Brasilia",
                    "independence": "1822-09-06T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Chile",
                    "capital": "Santiago",
                    "independence": "1818-02-11T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Colombia",
                    "capital": "Bogotá",
                    "independence": "1810-07-19T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Ecuador",
                    "capital": "Quito",
                    "independence": "1809-08-09T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Guyana",
                    "capital": "Georgetown",
                    "independence": "1966-05-25T22:00:00.000Z",
                    "unasur": true
                },
                {
                    "name": "Paraguay",
                    "capital": "Asunción",
                    "independence": "1811-05-13T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Peru",
                    "capital": "Lima",
                    "independence": "1821-07-27T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Suriname",
                    "capital": "Paramaribo",
                    "independence": "1975-11-24T23:00:00.000Z",
                    "unasur": true
                },
                {
                    "name": "Uruguay",
                    "capital": "Montevideo",
                    "independence": "1825-08-24T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Venezuela",
                    "capital": "Caracas",
                    "independence": "1811-07-04T23:10:04.000Z",
                    "unasur": true
                }
            ]
        }

        after = {
            "name": "South America",
            "summary": "South America (Spanish: América del Sur, Sudamérica or  \nSuramérica; Portuguese: América do Sul; Quechua and Aymara:  \nUrin Awya Yala; Guarani: Ñembyamérika; Dutch: Zuid-Amerika;  \nFrench: Amérique du Sud) is a continent situated in the  \nWestern Hemisphere, mostly in the Southern Hemisphere, with  \na relatively small portion in the Northern Hemisphere.  \nThe continent is also considered a subcontinent of the  \nAmericas.[2][3] It is bordered on the west by the Pacific  \nOcean and on the north and east by the Atlantic Ocean;  \nNorth America and the Caribbean Sea lie to the northwest.  \nIt includes twelve countries: Argentina, Bolivia, Brasil,  \nChile, Colombia, Ecuador, Guyana, Paraguay, Peru, Suriname,  \nUruguay, and Venezuela. The South American nations that  \nborder the Caribbean Sea—including Colombia, Venezuela,  \nGuyana, Suriname, as well as French Guiana, which is an  \noverseas region of France—are a.k.a. Caribbean South  \nAmerica. South America has an area of 17,840,000 square  \nkilometers (6,890,000 sq mi). Its population as of 2005  \nhas been estimated at more than 371,090,000. South America  \nranks fourth in area (after Asia, Africa, and North America)  \nand fifth in population (after Asia, Africa, Europe, and  \nNorth America). The word America was coined in 1507 by  \ncartographers Martin Waldseemüller and Matthias Ringmann,  \nafter Amerigo Vespucci, who was the first European to  \nsuggest that the lands newly discovered by Europeans were  \nnot India, but a New World unknown to Europeans.",
            "timezone": [
                -4,
                -2
            ],
            "demographics": {
                "population": 385744896,
                "largestCities": [
                    "São Paulo",
                    "Buenos Aires",
                    "Rio de Janeiro",
                    "Lima",
                    "Bogotá"
                ]
            },
            "languages": [
                "spanish",
                "portuguese",
                "inglés",
                "dutch",
                "french",
                "quechua",
                "guaraní",
                "aimara",
                "mapudungun"
            ],
            "countries": [
                {
                    "name": "Argentina",
                    "capital": "Rawson",
                    "independence": "1816-07-08T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Bolivia",
                    "capital": "La Paz",
                    "independence": "1825-08-05T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Peru",
                    "capital": "Lima",
                    "independence": "1821-07-27T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Brazil",
                    "capital": "Brasilia",
                    "independence": "1822-09-06T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Chile",
                    "capital": "Santiago",
                    "independence": "1818-02-11T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Ecuador",
                    "capital": "Quito",
                    "independence": "1809-08-09T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Guyana",
                    "capital": "Georgetown",
                    "independence": "1966-05-25T22:00:00.000Z",
                    "unasur": true
                },
                {
                    "name": "Paraguay",
                    "capital": "Asunción",
                    "independence": "1811-05-13T23:10:04.000Z",
                    "unasur": true
                },
                {
                    "name": "Suriname",
                    "capital": "Paramaribo",
                    "independence": "1975-11-24T23:00:00.000Z",
                    "unasur": true
                },
                {
                    "name": "Antártida",
                    "unasur": false
                },
                {
                    "name": "Colombia",
                    "capital": "Bogotá",
                    "independence": "1810-07-19T23:10:04.000Z",
                    "unasur": true,
                    "population": 42888594
                }
            ],
            "spanishName": "Sudamérica"
        }

        delta = jsondiffpatch.diff(before, after);

        // <pre style={{flexGrow: 1}}>{auditItem && JSON.stringify(auditItem, null, 2)}</pre>
        // <Inner dangerouslySetInnerHTML={{__html: formattedHtml}} />
        // {before && <div style={{flex: 1}}><Recursive delta={delta} source={before}/></div>}
        return (
            <div style={{display: "flex", flex: 1, flexDirection: "row"}}>
                <pre style={{flex: 1}}>{delta && JSON.stringify(delta, null, 2)}</pre>
                <StyledHighlightedJSON>
                    <JSONDeltaComponent
                        delta={delta}
                        json={before}
                        showUnchangedValues={true}
                    />
                </StyledHighlightedJSON>
            </div>
        );
    }
}

export { OwnProps };
export default ConfigurationAuditView;
