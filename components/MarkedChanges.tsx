import { renderToString } from "$fresh/src/server/deps.ts";
// @deno-types="npm:@types/diff"
import { Change } from "diff";
import { JSX } from "preact/jsx-runtime";
import { Del, Ins } from "./ModElement.tsx";

type ChangeWithElementValue = Omit<Change, "value"> & {
  value: string | JSX.Element;
};

interface MarkedChangesProps extends JSX.HTMLAttributes<HTMLModElement> {
  changes: ChangeWithElementValue[];
  onlyChangedLines?: boolean;
}

export default function MarkedChanges(
  { changes, onlyChangedLines, ...elProps }: MarkedChangesProps,
) {
  const marked = changes.map(({ added, removed, value }) =>
    added
      ? <Ins {...elProps}>{value}</Ins>
      : removed
      ? <Del {...elProps}>{value}</Del>
      : value
  );

  if (onlyChangedLines) {
    return <ChangedLines marked={marked} />;
  }
  return <>{marked}</>;
}

function ChangedLines({ marked }: { marked: (string | JSX.Element)[] }) {
  const str = renderToString(<>{marked}</>);
  const lines = str.split("\n").reverse();
  const changed = [];
  let insOpen = false;
  let delOpen = false;
  while (lines.length) {
    const line = lines.pop();
    const insStart = line!.lastIndexOf("<ins");
    const insEnd = line!.lastIndexOf("</ins");
    const delStart = line!.lastIndexOf("<del");
    const delEnd = line!.lastIndexOf("</del");
    insOpen = insStart > insEnd || (insEnd === -1 && insOpen);
    delOpen = delStart > delEnd || (delEnd === -1 && delOpen);
    if (insOpen || delOpen || insEnd > -1 || delEnd > -1) {
      changed.push(line);
    }
  }

  const __html = changed.join("\n");

  return <div dangerouslySetInnerHTML={{ __html }} />;
}
