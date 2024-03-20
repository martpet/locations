import Container from "../../../components/Container.tsx";
import { Place } from "../../../utils/types.ts";

interface PlaceHeaderProps {
  place: Place;
}

export default function PlaceHeader({ place }: PlaceHeaderProps) {
  return (
    <Container>
      <h1>{place.title}</h1>
      <AddressLine place={place} />
    </Container>
  );
}

function AddressLine({ place }: { place: Place }) {
  const ZOOM = 16;
  const [lng, lat] = place.lngLat;
  const mapLink = `/?place=${place.slug}#${ZOOM}/${lat}/${lng}`;
  return (
    <address class="my-5 not-italic before:content-['📍_']">
      {place.address[place.address.current]}
      <span class="text-sm not-italic whitespace-nowrap">
        {" — "}
        <a href={mapLink}>виж карта</a>
      </span>
    </address>
  );
}
