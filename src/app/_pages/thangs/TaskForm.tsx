import { getFormProps } from "@conform-to/react";
import { z } from "zod";
import { Forms, useConform } from "~/app/_components/Forms";
import type { recurringTasks } from "~/server/db/schema";

const taskFormSchema = z.object({
  title: z.string(),
  frequency: z.string(),
  frequencyType: z.enum(["daily", "weekly", "monthly", "yearly"]),
});
type TaskFormData = z.infer<typeof taskFormSchema>;
export function TaskForm(props: {
  submitLabel: string;
  onSubmit?: (values: TaskFormData) => void;
  onCancel?: () => void;
  initialValues: TaskFormData;
}) {
  const { form, fields, errorDisplay } = useConform(
    taskFormSchema,
    props.onSubmit,
  );

  return (
    <form {...getFormProps(form)}>
      <Forms.Labelled label="Title" fields={[fields.title]}>
        <Forms.TextField
          autoFocus
          field={fields.title}
          defaultValue={props.initialValues.title}
        />
      </Forms.Labelled>
      <Forms.Labelled
        label="Every"
        fields={[fields.frequency, fields.frequencyType]}
      >
        <div className="join join-vertical">
          <Forms.TextField
            field={fields.frequency}
            defaultValue={props.initialValues.frequency}
            placeholder="Input a number"
            type="number"
          />
          <Forms.SelectField
            field={fields.frequencyType}
            initialValue={props.initialValues.frequencyType}
            labels={{
              daily: "Days",
              weekly: "Weeks",
              monthly: "Months",
              yearly: "Years",
            }}
          />
        </div>
      </Forms.Labelled>
      <Forms.ButtonGroup>
        <Forms.SubmitButton label={props.submitLabel} />
        <Forms.Button label="Cancel" onClick={props.onCancel} />
      </Forms.ButtonGroup>
      {errorDisplay}
    </form>
  );
}

export function AsDbObject(htmlTask: TaskFormData) {
  return {
    title: htmlTask.title,
    schedule: schedule(),
  };
  function schedule(): typeof recurringTasks.$inferSelect.schedule {
    switch (htmlTask.frequencyType) {
      case "daily":
        return {
          type: htmlTask.frequencyType,
          numberOfDays: parseInt(htmlTask.frequency),
        };
      case "weekly":
        return {
          type: htmlTask.frequencyType,
          numberOfWeeks: parseInt(htmlTask.frequency),
        };
      case "monthly":
        return {
          type: htmlTask.frequencyType,
          numberOfMonths: parseInt(htmlTask.frequency),
        };
      case "yearly":
        return {
          type: htmlTask.frequencyType,
          numberOfYears: parseInt(htmlTask.frequency),
        };
    }
  }
}
export function FromDbObject(dbo: typeof recurringTasks.$inferSelect) {
  return {
    title: dbo.title,
    frequencyType: dbo.schedule.type,
    frequency: frequency(),
  };
  function frequency() {
    switch (dbo.schedule.type) {
      case "daily":
        return dbo.schedule.numberOfDays.toString();
      case "weekly":
        return dbo.schedule.numberOfWeeks.toString();
      case "monthly":
        return dbo.schedule.numberOfMonths.toString();
      case "yearly":
        return dbo.schedule.numberOfYears.toString();
    }
  }
}
