/* Copyright © 2020 matcher-ice
 * This Source Code Form is subject to the terms of the Mozilla Public License, v. 2.0. If a copy of the MPL was not distributed with this file, You can obtain one at https://mozilla.org/MPL/2.0/. 
 * This Source Code Form is “Incompatible With Secondary Licenses”, as defined by the Mozilla Public License, v. 2.0. */

export type XmlFlatNode = {
    readonly name: string;
    readonly attrs?: ReadonlyMap<string, string>;
}

// すべてのノードをベタに返す。かなり適当な実装
function* getXmlFlatNodeString(contentString: string): IterableIterator<string>
{
    let start = 0;
    for (let i = 0; i < contentString.length; ++i)
    {
        switch (contentString[i])
        {
            case "<":
            case "/":
            case ">":
                {
                    const r = contentString.substring(start, i);
                    start = i + 1;
                    if (r !== "" && !r.startsWith("?"))
                    {
                        yield r;
                    }
                }
                break;
            default:
                break;
        }
    }
}

const attrRegExp = new RegExp(/^(\w+)="([^"]*)"$/);

function getXmlFlatNode(flatNodeString: string): XmlFlatNode
{
    const split = flatNodeString.split(" ").filter(s => s !== "");
    const name = split[0];
    split.shift();
    if (split.length === 0)
    {
        return { name };
    }

    const attrs = new Map<string, string>();
    for (const attr of split)
    {
        const match = attrRegExp.exec(attr);
        if (match != null)
        {
            attrs.set(match[1], match[2]);
        }
    }
    return { name, attrs };
}

export function* getXmlFlatNodes(xml: string): IterableIterator<XmlFlatNode>
{
    for (const flatNodeString of getXmlFlatNodeString(xml))
    {
        yield getXmlFlatNode(flatNodeString);
    }
}