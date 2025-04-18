import type { TemplateString } from "next/dist/lib/metadata/types/metadata-types";
import type { FC, PropsWithChildren, ReactNode } from "react";

export const PageLayout: FC<
  PropsWithChildren<{
    title?: string | TemplateString | null;
    sidebar?: ReactNode;
  }>
> = (props) => {
  return (
    <div>
      <div className="text-primary-content mb-10 text-4xl font-bold">
        {displayTitle()}
      </div>
      <div className="bg-base-200 flex flex-row rounded p-4 gap-4">
        {props.sidebar && <div className="flex w-xs flex-col">{props.sidebar}</div>}
        <div className="flex-1">{props.children}</div>
      </div>
    </div>
  );

  function displayTitle(): ReactNode {
    if (props.title === null || props.title === undefined || typeof props.title === 'string') {
      return props.title;
    }
    if (typeof props.title === 'object') {
      if ('default' in props.title) {
        return props.title.default;
      }
      if ('absolute' in props.title) {
        return props.title.absolute;
      }
    }
  }
};
