import { useRef } from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import Input from "../../../components/Input.tsx";
import Spinner from "../../../components/Spinner.tsx";
import { Address } from "../../../utils/types.ts";

interface FormAddressProps extends JSX.HTMLAttributes<HTMLFieldSetElement> {
  address: Address | null;
  isFetchingAddress: boolean;
  onAddressTypeChange(k: keyof Address): void;
  onCustomAddressChange: JSX.GenericEventHandler<HTMLInputElement>;
}

export default function FormAddress(props: FormAddressProps) {
  const {
    address,
    isFetchingAddress,
    onAddressTypeChange,
    onCustomAddressChange,
    ...elProps
  } = props;
  const customAddressInputRef = useRef<HTMLInputElement>(null);

  const handleAddressTypeChange = (key: keyof Address) => () => {
    onAddressTypeChange(key);
    if (key === "custom") {
      setTimeout(() => {
        customAddressInputRef.current?.focus();
      });
    }
  };

  return (
    <fieldset
      disabled={isFetchingAddress}
      class={`${elProps.class || ""} flex flex-col gap-3`}
    >
      <legend class="flex items-center gap-1 mb-2">
        Адрес {isFetchingAddress && <Spinner />}
      </legend>
      {address && !isFetchingAddress && (
        <>
          {Object.entries(address).map((entry) => {
            const [key, val] = entry as [keyof Address, string];
            const isCustomCurrent = address.current === "custom";
            if (key === "current" || key === "details") return;
            return (
              <label class="flex leading-5">
                <input
                  type="radio"
                  name="address"
                  value={key}
                  checked={address.current === key}
                  required
                  onChange={handleAddressTypeChange(key)}
                  class={`mr-2 relative top-[2px]`}
                />
                {key !== "custom" ? val : (
                  <Input
                    elRef={customAddressInputRef}
                    placeholder="друг адрес"
                    type="text"
                    value={val}
                    disabled={!isCustomCurrent}
                    required
                    size={45}
                    onChange={onCustomAddressChange}
                    class={`max-w-sm px-2 py-1 relative -top-[2px] text-sm
                     ${!isCustomCurrent ? "pointer-events-none" : ""}
                    `}
                  />
                )}
              </label>
            );
          })}
        </>
      )}
    </fieldset>
  );
}
