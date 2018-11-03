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
const arrayKeyComparer = (key1: any, key2: any) => arrayKeyToSortNumber(key1) - arrayKeyToSortNumber(key2);

const Name = styled.span`
  margin-right: 0.5rem;
  color: black;
  font-weight: 600;
  ::after {
    content: ":";
  }
`;

type DeltaRendererProps = {
    name: string;
    delta: any;
}

const Added = (props: DeltaRendererProps) => {
    const { delta, name } = props;

    let value = delta && delta[0];

    // TODO: Simple Recurse without delta checking
    if (typeof value === "object") {
        // value = <HighlightedJSON json={value} delta={undefined} />;
        value = JSON.stringify(value, null, 2);
    }

    return (
        <span style={{backgroundColor: '#bbffbb'}}>
            <Name>{name}</Name>
            {value}
        </span>
    );
}

const Removed = (props: DeltaRendererProps) => {
    const { delta, name } = props;

    let value = delta && delta[0];

    // TODO: Simple Recurse without delta checking
    if (typeof value === "object") {
        // value = <HighlightedJSON json={value} delta={undefined} />;
        value = JSON.stringify(value);
    }

    return (
        <span style={{backgroundColor: '#ffbbbb', textDecoration: "line-through"}}>
            <Name>{name}</Name>
            {value}
        </span>
    );
}

const Moved = (props: DeltaRendererProps) => {
    const { delta, name } = props;

    console.log(delta);

    let value = delta && delta[1];

    // TODO: Simple Recurse without delta checking
    if (typeof value === "object") {
        // value = <HighlightedJSON json={value} delta={undefined} />;
        value = JSON.stringify(value);
    }

    return (
        <>
            <Name>{name}</Name>
            <span style={{backgroundColor: '#ffffbb'}}>
                => {value}
            </span>
        </>
    );
}

const Modified = (props: DeltaRendererProps) => {

    const { delta, name } = props;

    const leftValue = delta && delta[0];
    const rightValue = delta && delta[1];

    return (<span>
        <Name>{name}</Name>
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
    </span>);
}

const TextDiff = (props: {id: string, delta: any[]}) => {
    const value = props.delta && props.delta[0] && JSON.stringify(props.delta[0]);
    return <span style={{display: "block", backgroundColor: '#cccccc'}}>{props.id}: => {value}</span>
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

    return "unknown";
}

const HighlightedJSON = (props: { json: object, delta: any }) => {

    const { delta, json } = props;

    const highlightedJSON = (jsonObj: any, deltaObj: any) => {

        const jsonKeys = Object.keys(jsonObj);
        const deltaKeys = deltaObj && Object.keys(deltaObj);

        let keys = jsonKeys;

        if (deltaKeys) {

            // Combine and remove duplicates
            keys = jsonKeys.concat(deltaKeys)
            keys = keys.filter((item, i) => keys.indexOf(item) === i);

            // The delta is for an Array
            if (keys.indexOf("_t") >= 0) {
                keys = keys.filter(key => key !== "_t").sort(arrayKeyComparer);
            } else {
                keys = keys.sort();
            }
        }

        // https://github.com/benjamine/jsondiffpatch/blob/master/src/formatters/base.js#L154
        let moveDestinations = {};

        if (deltaKeys) {

            // let hasMoveDestinations = false;

            deltaKeys.forEach(deltaKey => {

                const deltaValue = deltaObj[deltaKey];
                const deltaType = getDeltaType(deltaValue, undefined);

                if (deltaType == "moved") {
                    // hasMoveDestinations = true;

                    // Mapped by the to destination
                    // substr removed the leading _
                    moveDestinations[deltaValue[1].toString()] = {
                        desc: `${deltaKey.substr(1)} was moved to ${deltaValue[1].toString()}`,
                        key: deltaKey,
                        value: jsonObj[parseInt(deltaKey.substr(1))]
                    }
                }
            });
        }

        return keys && keys.map(key => {

            const movedFrom = moveDestinations && moveDestinations[key];

            let currentValue = jsonObj[key];
            const currentDelta = deltaObj && deltaObj[key];
            const currentDeltaType = getDeltaType(currentDelta, movedFrom);


            if (currentDeltaType === "unchanged") {
                return null;
            }

            if (movedFrom) {
                currentValue = movedFrom.value;
                console.log(`${key} = ${movedFrom.desc}`);
            }

            const valueType: any = Array.isArray(currentValue) ? "array" : typeof currentValue;

            // If it's an Array or a Object we need to process it's children
            // Otherwise we show the delta or the unchanged value
            const isSimpleValue = ["string", "number", "boolean"].indexOf(valueType) !== -1 || !currentValue;

            let deltaRenderer;
            if (currentDeltaType === "added") {
                deltaRenderer = <Added name={key} delta={currentDelta} />
            }
            else if (currentDeltaType === "deleted") {

                deltaRenderer = <Removed name={key} delta={currentDelta} />
            }
            else if (currentDeltaType === "moved") {

                deltaRenderer = <Moved name={key} delta={currentDelta} />
            }
            else if (currentDeltaType === "modified") {

                deltaRenderer = <Modified name={key} delta={currentDelta} />
            }
            else if (currentDeltaType === "textdiff") {

                deltaRenderer = <TextDiff id={key} delta={currentDelta} />

            }
            else if (currentDelta === "node") {
                deltaRenderer = <>
                    <Name>Required Node {key}</Name>
                    {highlightedJSON(currentValue, currentDelta)}
                </>
            }
            else {

                if (isSimpleValue) {
                    deltaRenderer = <span>
                        <Name>{key}</Name>
                        {`${currentValue}`}
                    </span>;
                } else {
                    deltaRenderer = <>
                        <Name>{key}</Name>
                        {highlightedJSON(currentValue, currentDelta)}
                    </>
                }
            }

            {/*
            <span className="key">{key} |</span>

            */}
            return (
                <div key={key} className="line">
                    <span><i>{currentDeltaType}</i> |</span>
                    {deltaRenderer}
                </div>
            );
        })};

    return <div>{highlightedJSON(json, delta)}</div>;
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
  /*
  .key {
    margin-right: 0.5rem;
    color: black;
    font-weight: 600;
  }
  .string {
    color: green;
  }
  .number {
    color: blue;
  }
  .boolean {
    color: purple;
  }
  .null {
    color: red;
  }
  */
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

        /*
        const diffLines = diffs && diffs.map((a, i) => {
                if (a.added) {
                    return <AddedSpan key={i}>{`+ ${a.value}`}</AddedSpan>;
                }
                else if (a.removed) {
                    return <RemovedSpan key={i}>{`- ${a.value}`}</RemovedSpan>;
                } else {
                    return `  ${a.value}`;
                }
            }
        );
        */
        // console.log(diffs);

        // <pre style={{flexGrow: 1}}>{auditItem && JSON.stringify(auditItem, null, 2)}</pre>
        // <Inner dangerouslySetInnerHTML={{__html: formattedHtml}} />
        // {before && <div style={{flex: 1}}><Recursive delta={delta} source={before}/></div>}
        return (
            <div style={{display: "flex", flex: 1, flexDirection: "row"}}>
                <pre style={{flex: 1}}>{delta && JSON.stringify(delta, null, 2)}</pre>
                <StyledHighlightedJSON><HighlightedJSON delta={delta} json={before} /></StyledHighlightedJSON>
            </div>
        );
    }
}

export { OwnProps };
export default ConfigurationAuditView;
