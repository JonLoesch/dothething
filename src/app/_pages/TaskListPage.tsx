"use client";;
import {
  Button,
  Checkbox,
  Dialog,
  DialogTrigger,
  GridList,
  GridListItem,
  Group,
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
import { useTRPC } from "~/trpc/react";
import { type taskGroups, type recurringTasks } from "~/server/db/schema";
import { type Schedule } from "~/model/schedule";
import {
  layoutSection,
  PageWithSections,
  type PropsWithSectionHooks,
} from "../_layout/PageWithSections";
import type { TaskGroupId, TaskId } from "../_util/validators";
import { z } from "zod";
import { titles } from "../_util/titles";
import { type taskRouter } from "~/server/api/routers/task";
import { useWatchState } from "../_util/useWatchState";
import { Forms, useConform } from "../_components/Forms";
import { getFormProps } from "@conform-to/react";
import { useSelectId } from "../_util/useSelectState";
import { Icon } from "../_fragments/Icon";
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
import { EmptyListDisplay } from "../_fragments/EmptyListDisplay";
import { Explain } from "../_fragments/Explain";
import { ViewAll } from "./thangs/ViewAll";
import { ViewGroup } from "./thangs/ViewGroup";
import { ViewTask } from "./thangs/ViewTask";

import { useQuery } from "@tanstack/react-query";

export const TaskListPage: FC = () => {
  const api = useTRPC();
  const allGroups = useQuery(api.task.allGroups.queryOptions());
  const [selectedGroup, selectGroup] = useSelectId(
    allGroups.isSuccess && allGroups.data,
  );
  const [selectedTask, selectTask] = useSelectId(selectedGroup?.tasks);

  return (
    <PageWithSections
      levels={[
        layoutSection({
          Component: ViewAll,
          title: titles.list,
          params: allGroups.isSuccess && {
            groups: allGroups.data,
            selectedGroup,
            selectGroup,
          },
          close: () => undefined,
        }),
        layoutSection({
          Component: ViewGroup,
          title: selectedGroup?.title,
          params: selectedGroup
            ? {
                ...selectedGroup,
                selectTask,
                selectedTask,
              }
            : null,
          close: () => selectGroup(null),
        }),
        layoutSection({
          Component: ViewTask,
          title: selectedTask?.title,
          params: selectedTask
            ? {
                ...selectedTask,
              }
            : null,
          close: () => selectTask(null),
        }),
      ]}
    />
  );
};

