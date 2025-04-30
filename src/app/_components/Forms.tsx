import {
  useCallback,
  useEffect,
  useReducer,
  useRef,
  type FC,
  type FormEvent,
  type HTMLInputTypeAttribute,
  type InputHTMLAttributes,
  type PropsWithChildren,
  type ReactNode,
} from "react";
import { type taskRouter } from "~/server/api/routers/task";
import {
  getFormProps,
  getInputProps,
  getSelectProps,
  useForm,
  type FieldMetadata,
  type Intent,
} from "@conform-to/react";
import { getZodConstraint, parseWithZod } from "@conform-to/zod";
import type { inferProcedureInput } from "@trpc/server";
import { type z } from "zod";
import type { recurringTasks } from "~/server/db/schema";
import { ConditionalWrap } from "../_util/ConditionalWrap";

// interface FormField<T extends z.ZodTypeAny> {
//     name: string,
//     element: ReactNode
//     schema: T,
// }
export function useConform<T extends z.ZodTypeAny>(
  schema: T,
  onSubmit?: (values: z.infer<T>) => void,
) {
  const handlerRef = useRef(onSubmit);
  useEffect(() => {
    handlerRef.current = onSubmit;
  }, [onSubmit]);
  const stableHandler = useCallback(
    (event: FormEvent, context: { formData: FormData }) => {
      handlerRef.current?.(schema.parse(Object.fromEntries(context.formData)) as z.infer<T>);
      event.preventDefault();
    },
    [schema],
  );
  const [form, fields] = useForm({
    shouldValidate: "onBlur",
    shouldRevalidate: "onInput",
    onValidate(context) {
      return parseWithZod(context.formData, {
        schema,
      });
    },
    constraint: getZodConstraint(schema),
    onSubmit: stableHandler,
  });
  return {
    form,
    fields,
    errorDisplay: form.status === "error" && (
      <div className="alert alert-error alert-soft">
        There are validation errors above
      </div>
    ),
  };
}

function Labelled(
  props: PropsWithChildren<{
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    fields: FieldMetadata<string, any, string[]>[];
    label: string;
  }>,
) {
  const firstError = props.fields
    .flatMap((x) => x.errors)
    .find((x) => typeof x === "string");

  return (
    <div>
      <label className="input validator h-[unset]" aria-invalid={typeof firstError === 'string' ? true : undefined}>
        <span className="label">{props.label}:</span>
        {props.children}
      </label>
      <div
        className={`validator-hint mb-1 ${typeof firstError === "string" ? "block" : "invisible"}`}
      >
        {firstError ?? "Placeholder"}
      </div>
    </div>
  );
}

function TextField({field, type, ...rest}: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: FieldMetadata<string, any, string[]>;
  // placeholder?: HTMLInputElement["placeholder"];
  type?: "text" | "number";
} & Pick<InputHTMLAttributes<unknown>, 'placeholder' | 'autoFocus' | 'defaultValue'>) {
  return (
    <input
      {...getInputProps(field, { type: type ?? "text" })}
      className="input h-10 focus:outline-0"
      aria-placeholder={rest.placeholder}
      {...rest}
    />
  );
}
function SelectField<T extends string>(props: {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  field: FieldMetadata<T, any, string[]>;
  labels: Record<T, string>;
  initialValue: T;
}) {
  return (
    <select
      className="select h-10 focus:outline-0"
      defaultValue={props.initialValue}
      {...getSelectProps(props.field)}
    >
      {Object.entries<string>(props.labels).map(([key, value]) => (
        <option value={key} key={key}>
          {value}
        </option>
      ))}
    </select>
  );
}
function SubmitButton(props: { label: string }) {
  return (
    <input
      type="submit"
      className="btn btn-primary w-full"
      value={props.label}
    />
  );
}
function Button(props: { label: string; onClick?: () => void }) {
  return (
    <button
      className="btn w-full"
      onClick={(event) => {
        if (props.onClick) {
          props.onClick();
          event.preventDefault();
        }
      }}
    >
      {props.label}
    </button>
  );
}
function ButtonGroup(props: PropsWithChildren) {
  return (
    <>
      <div className="divider" />
      <div className="join join-vertical [&_.btn]:join-item w-full max-w-72 gap-4 self-end">
        {props.children}
      </div>
    </>
  );
}

function ConfirmDialog(
  props: PropsWithChildren<
    ReturnType<typeof useConform> & {
      close: () => void;
      confirmLabel: string;
      className?: string;
    }
  >,
) {
  return (
    <form {...getFormProps(props.form)} className={props.className}>
      {props.children}
      <ButtonGroup>
        <SubmitButton label={props.confirmLabel} />
        <Button label="Cancel" onClick={props.close}></Button>
      </ButtonGroup>
    </form>
  );
}
function ConfirmDelete(
  props: PropsWithChildren<
    ReturnType<typeof useConform> & {
      close: () => void;
    }
  >,
) {
  return (
    <ConfirmDialog
      {...props}
      className="[&_input[type='submit'].btn]:btn-error"
      confirmLabel="Delete"
    />
  );
}

export const Forms = {
  Labelled,
  SelectField,
  TextField,
  SubmitButton,
  Button,
  ButtonGroup,
  ConfirmDialog,
  ConfirmDelete,
};
