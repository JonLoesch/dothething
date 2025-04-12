import { Select } from "flowbite-react";

export function EnumSelect<TEnum extends string>(props: {
  enumLabels: Record<TEnum, string>;
  value: TEnum;
  setValue: (v: TEnum) => void;
}) {
  return (
    <Select
      required
      value={props.value}
      onChange={(e) => props.setValue(e.target.value as TEnum)}
    >
      {(Object.keys(props.enumLabels) as TEnum[]).map((e) => (
        <option key={e} value={e}>
          {props.enumLabels[e]}
        </option>
      ))}
    </Select>
  );
}
