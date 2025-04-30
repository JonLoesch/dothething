"use client";

import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  GridList,
  GridListItem,
  Heading,
  Input,
  Label,
  Modal,
  ModalOverlay,
  TextField,
  type GridListProps,
  type ModalRenderProps,
} from "react-aria-components";
import {
  Fragment,
  useMemo,
  useReducer,
  useState,
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import { type taskGroups, type recurringTasks } from "~/server/db/schema";
import { type Schedule } from "~/model/schedule";
import type { UseMutationResult } from "@tanstack/react-query";
import pluralize from "pluralize";
import { groupCollapsed } from "console";
import {
  differenceInDays,
  differenceInMonths,
  differenceInWeeks,
  differenceInYears,
  subDays,
} from "date-fns";
import type { PropsWithSectionHooks } from "~/app/_layout/PageWithSections";
import type { TaskId } from "~/app/_util/validators";
import type { taskRouter } from "~/server/api/routers/task";
import { ListSection } from "~/app/_fragments/ListSection";
import { ModalTriggerButton } from "~/app/_fragments/ModalTriggerButton";
import { AddTaskModal } from "./AddTaskModal";
import { DeleteGroupModal } from "./DeleteGroupModal";
import { displaySchedule, type Group, type Target, type Task } from "./common";
import { EditGroupModal } from "./EditGroupModal";

export const ViewGroup: FC<
  PropsWithSectionHooks<
    Group & {
      selectTask: (task: TaskId | null) => void;
      selectedTask: Task | null;
    }
  >
> = (props) => {
  return (
    <ListSection
      items={props.tasks}
      sectionTitle={props.title}
      select={props.selectTask}
      selected={props.selectedTask}
      empty="You do not have any tasks created yet in this group. Please add a task below to get started."
      item={(task) => {
        const days = differenceInDays(task.nextDueDate, new Date());
        const weeks = differenceInWeeks(task.nextDueDate, new Date());
        const months = differenceInMonths(task.nextDueDate, new Date());
        const years = differenceInYears(task.nextDueDate, new Date());

        const timespan =
          Math.abs(years) >= 2
            ? pluralize("year", Math.abs(years), true)
            : Math.abs(months) >= 2
              ? pluralize("month", Math.abs(months), true)
              : Math.abs(weeks) >= 2
                ? pluralize("week", Math.abs(weeks), true)
                : pluralize("day", Math.abs(days), true);

        return {
          title: task.title,
          children: (
            <>
              {days > 0 ? (
                <span>next in {timespan}</span>
              ) : days === 0 ? (
                <span>today</span>
              ) : (
                <span>{timespan} past time</span>
              )}
              <span> ({displaySchedule(task.schedule)}) </span>
            </>
          ),
        };
      }}
    >
      <ModalTriggerButton modal={AddTaskModal} groupId={props.id}>
        Create New Task
      </ModalTriggerButton>
      <div className="divider" />
      <ModalTriggerButton modal={EditGroupModal} {...props}>
        Edit this group
      </ModalTriggerButton>
      <ModalTriggerButton
        className="btn-error btn-outline"
        modal={DeleteGroupModal}
        {...props}
      >
        Delete this group
      </ModalTriggerButton>
    </ListSection>
  );
};
