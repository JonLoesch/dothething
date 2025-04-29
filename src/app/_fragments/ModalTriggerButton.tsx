import {
  createElement,
  type FC,
  type HTMLAttributes,
  type PropsWithChildren,
} from "react";
import {
  Button,
  DialogTrigger,
  Modal,
  type ModalRenderProps,
} from "react-aria-components";

export function ModalTriggerButton<T>({
  modal,
  className,
  children,
  ...props
}: PropsWithChildren<{
  modal: FC<ModalRenderProps & T>;
}> &
  Pick<HTMLAttributes<HTMLDivElement>, "className"> &
  T) {
  return (
    <DialogTrigger>
      <Button className={`btn ${className}`}>{children}</Button>
      <Modal isDismissable>
        {(m) => {
          // eslint-disable-next-line @typescript-eslint/no-unsafe-argument, @typescript-eslint/no-explicit-any
          return createElement(modal, { ...m, ...props } as any);
        }}
      </Modal>
    </DialogTrigger>
  );
}
