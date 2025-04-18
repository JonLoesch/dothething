import type { FC, PropsWithChildren, ReactNode } from "react";

export const PageLayout: FC<
  PropsWithChildren<{
    title: ReactNode;
    sidebar?: ReactNode;
  }>
> = (props) => {
  return (
    <div>
      <div className="text-primary-content mb-10 text-4xl font-bold">
        {props.title}
      </div>
      <div className="bg-base-200 flex flex-row rounded p-4 gap-4">
        {props.sidebar && <div className="flex w-xs flex-col">{props.sidebar}</div>}
        <div className="flex-1">{props.children}</div>
      </div>
    </div>
  );
};
