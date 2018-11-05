import * as React from "react";

import { Delta, DiffPatcher } from "jsondiffpatch";

import JSONFormatterComponent from "./JSONFormatterComponent";
import JSONDeltaFormatterComponent from "./JSONDeltaFormatterComponent";

interface OwnProps {
    className?: string;
}

class ConfigurationAuditView extends React.Component<OwnProps, {}> {

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

        return (
            <div>
                <JSONDeltaFormatterComponent
                    delta={delta}
                    json={before}
                    showUnchangedValues={false}
                />
                <JSONFormatterComponent json={before} />
            </div>
        );
    }
}

export {OwnProps};
export default ConfigurationAuditView;
