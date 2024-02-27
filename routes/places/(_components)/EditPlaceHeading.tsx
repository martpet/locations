import { Place } from "../../../utils/types.ts";

interface EditPlaceHeadingProps {
  place: Place;
}

export default function EditPlaceHeading(props: EditPlaceHeadingProps) {
  return (
    <hgroup class="mb-10">
      <h1 class="mb-0">Редактирай</h1>
      <p class="mt-4 text-xl font-bold">{props.place.title}</p>
    </hgroup>
  );
}
