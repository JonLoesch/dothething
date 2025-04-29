import type { Group } from "next/dist/shared/lib/router/utils/route-regex";
import pluralize from "pluralize";
import type { FC, PropsWithChildren, ReactNode } from "react";
import {
  GridList,
  GridListItem,
  DialogTrigger,
  Button,
  Modal,
  type GridListProps,
} from "react-aria-components";
import { EmptyListDisplay } from "~/app/_fragments/EmptyListDisplay";
import type { PropsWithSectionHooks } from "~/app/_layout/PageWithSections";
import type { TaskGroupId } from "~/app/_util/validators";

export function ListSection<T extends { id: number }>(
  props: PropsWithChildren<{
    sectionTitle: string;
    items: T[];
    selected: T | null;
    select: (id: T["id"] | null) => void;
    item: (v: T) => {
      title: string;
      children: ReactNode;
    };
    empty: string;
  }>,
) {
  return (
    <div className="has-selected:[&>*]:not-has-selected:hidden flex flex-col gap-4">
      <div className="text-xl">{props.sectionTitle}:</div>
      <GridList
        className="flex flex-col gap-2"
        aria-label="Your existing task groups"
        items={props.items}
        selectionMode="single"
        selectionBehavior="replace"
        selectedKeys={props.selected ? [props.selected.id] : []}
        onSelectionChange={(keys) => {
          if (keys instanceof Set) {
            if (
              keys.size === 1 &&
              "currentKey" in keys &&
              typeof keys.currentKey === "number"
            ) {
              props.select(keys.currentKey);
            }
          }
        }}
      >
        {(v) => {
          const x = props.item(v);
          return (
            <GridListItem textValue={x.title} className="selected:bg-accent flex flex-col items-stretch">
              <span className="link link-secondary [&~*]:ml-4">{x.title}</span>
              {x.children}
            </GridListItem>
          );
        }}
      </GridList>
      <EmptyListDisplay items={props.items}> {props.empty} </EmptyListDisplay>
      {props.children}
      {/* <div className="divider" />
      <DialogTrigger>
        <Button className="btn">Create New Group</Button>
        <Modal isDismissable>
          {(m) => {
            return <AddGroupModal {...m} />;
          }}
        </Modal>
      </DialogTrigger> */}
    </div>
  );
}
