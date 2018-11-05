import * as React from "react";
import styled from "styled-components";

type OwnProps = {
    json?: any,
    className?: string
}

// https://javascriptweblog.wordpress.com/2011/08/08/fixing-the-javascript-typeof-operator/
const toType = (obj: any) => ({}).toString.call(obj).match(/\s([a-zA-Z]+)/)[1].toLowerCase();

const PropertyName = styled.span`
  // float: left;
  margin-right: 0.5rem;
  color: black;
  font-weight: 600;
  text-transform: capitalize;
  ::after {
    content: ":";
  }
`;

const Indent = styled.div`
  margin-left: 1rem;
  
  /*
  & {
    margin-left: 0;
  }
  */
`;

const Value = styled.span``;

const JSONFormatterComponent: React.SFC<OwnProps> = (props) => {

    const { className, json } = props;
    const typeOfSource = toType(json);

    let result = null;

    if (typeOfSource === "object" || typeOfSource === "array") {

        const keys: string[] = Object.keys(json);
        result = keys.map(key => {

            const value = json[key];
            const typeOfValue = toType(value);
            const shouldRecurseValue = typeOfValue === "object" || typeOfValue === "array";

            // TODO: We could format & style the value based on it's type
            return (
                <Indent className={className} key={key}>
                    <PropertyName>{key}</PropertyName>
                    {shouldRecurseValue ? <JSONFormatterComponent json={value}/> : <Value>{`${value}`}</Value>}
                </Indent>
            );
        });
    }

    return result && <>{result}</>;
};

export { OwnProps };
export { Indent, PropertyName, Value };
export default JSONFormatterComponent;