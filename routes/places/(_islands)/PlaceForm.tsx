import { asset, Head } from "$fresh/runtime.ts";
import type { IExif } from "exif-parser";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "preact/hooks";
import { JSX } from "preact/jsx-runtime";
import Button from "../../../components/Button.tsx";
import Highlight from "../../../components/Highlight.tsx";
import Input, { TextArea } from "../../../components/Input.tsx";
import Label from "../../../components/Label.tsx";
import Spinner from "../../../components/Spinner.tsx";
import slugify from "../../../utils/slugify.ts";
import {
  Address,
  AddressType,
  LngLat,
  Place,
  PlaceType,
} from "../../../utils/types.ts";
import { CheckSlugUniqueRespData } from "../check-slug-unique.ts";
import { FindAddressReqData, FindAddressRespData } from "../find-address.ts";
import { PutPlaceReqData, PutPlaceRespData } from "../index.tsx";
import {
  PostUploadSessionReqData,
  PostUploadSessionRespData,
} from "../upload-session.ts";
import FormAddress from "./FormAddress.tsx";
import { FormGallery, GalleryItem } from "./FormGallery.tsx";

declare global {
  interface Window {
    ExifParser: {
      create(x: ArrayBuffer): IExif;
    };
  }
}

interface CurrentPhoto extends GalleryItem {
  s3Key: string;
  file?: never;
}

interface AddedPhoto extends GalleryItem {
  s3Key?: never;
  file: File;
}

type Photo = CurrentPhoto | AddedPhoto;

type DetectedLngLat = LngLat | null | undefined;

interface CurrentPlaceProps {
  editedPlace: Place;
  editedPlaceType: PlaceType;
  publishedVersionstamp: string | null;
  draftVersionstamp: string | null;
  photosOrigin: string;
  isAdmin: boolean | undefined;
}

interface NewPlaceProps {
  editedPlace?: never;
  editedPlaceType?: never;
  publishedVersionstamp?: never;
  draftVersionstamp?: never;
  photosOrigin?: never;
  isAdmin: boolean | undefined;
}

type PlaceFormProps = CurrentPlaceProps | NewPlaceProps;

export default function PlaceForm(
  {
    editedPlace,
    editedPlaceType,
    publishedVersionstamp,
    draftVersionstamp,
    photosOrigin,
    isAdmin,
  }: PlaceFormProps,
) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const titleInputRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState(editedPlace?.title);
  const [description, setDescription] = useState(editedPlace?.description);
  const [lngLat, setLngLat] = useState<DetectedLngLat>(editedPlace?.lngLat);
  const prevLngLatRef = useRef<DetectedLngLat>(editedPlace?.lngLat);
  const [photos, setPhotos] = useState<Photo[]>(createInitialPhotos);
  const [address, setAddress] = useState(editedPlace?.address || null);
  const [overwriteRev, setOverwriteRev] = useState(false);
  const [isFetchingAddress, setIsFetchingAddress] = useState(false);
  const [isLoadingPhotos, setIsLoadingPhotos] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [canLeavePage, setCanLeavePage] = useState(true);
  const [redirectUrl, setRedirectUrl] = useState("");
  const [nonUniqueTitle, setNonUniqueTitle] = useState("");

  function createInitialPhotos() {
    return (editedPlace?.photos || []).map((s3Key, i) => ({
      id: crypto.randomUUID(),
      url: `${photosOrigin}/${s3Key}`,
      s3Key,
    }));
  }

  const sortPhoto = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPhotos((prevPhotos) => {
        const photo = prevPhotos[fromIndex];
        const newPhotos = prevPhotos.toSpliced(fromIndex, 1);
        newPhotos.splice(toIndex, 0, photo);
        return newPhotos;
      });
    },
    [],
  );

  const addedFiles = useMemo(() => {
    const files: File[] = [];
    photos.forEach((p) => {
      if (p.file) files.push(p.file);
    });
    return files;
  }, [photos]);

  const areInitialPhotosRemoved = !photos.filter((photo) => photo.s3Key).length;

  let isNewContent = true;

  if (editedPlace) {
    isNewContent = Boolean(
      editedPlace.title !== title ||
        (editedPlace.description || "") !== (description || "") ||
        JSON.stringify(editedPlace.photos) !== JSON.stringify(photos) ||
        JSON.stringify(editedPlace.address) !== JSON.stringify(address),
    );
  }

  const onFormSubmit: JSX.GenericEventHandler<HTMLFormElement> = async (ev) => {
    ev.preventDefault();
    // Validate
    if (!isNewContent) {
      setErrorMsg("Съдържанието не е променено");
      return;
    }
    if (!title) {
      setErrorMsg("Няма заглавие");
      return;
    }
    if (!lngLat) {
      return;
    }
    if (!photos.length) {
      setErrorMsg("Няма снимки");
      return;
    }
    if (!address) {
      setErrorMsg("Добави адрес");
      return;
    }
    // Prepare UI
    setErrorMsg("");
    setIsUploading(true);
    setCanLeavePage(false);
    // Check title is unique
    if (title !== editedPlace?.title) {
      const url = `/places/check-slug-unique?q=${await slugify(title)}`;
      const resp = await fetch(url);
      const isUnique = (await resp.json()) as CheckSlugUniqueRespData;
      if (!isUnique) {
        setNonUniqueTitle(title);
        setIsUploading(false);
        setCanLeavePage(true);
        return;
      }
    }
    // Upload files to S3
    let uploadSessionId = null;
    let uploadSessionS3Keys: string[] = [];
    try {
      const uploadSessionData = await uploadPhotos(addedFiles);
      if (uploadSessionData) {
        uploadSessionId = uploadSessionData.uploadSessionId;
        uploadSessionS3Keys = uploadSessionData.s3Keys;
      }
    } catch (err) {
      setErrorMsg(`Грешка: ${err.message}`);
      setIsUploading(false);
      setCanLeavePage(true);
      return;
    }
    uploadSessionS3Keys.reverse();
    const finalS3Keys = photos.map(({ s3Key }) =>
      (s3Key || uploadSessionS3Keys.pop())!
    );
    // Save place in db
    let data: PutPlaceReqData;
    if (editedPlace) {
      data = {
        title,
        photos: finalS3Keys,
        description,
        lngLat,
        uploadSessionId,
        editedPlaceId: editedPlace?.id,
        editedPlaceRev: editedPlace?.rev,
        editedPlaceType,
        publishedVersionstamp,
        draftVersionstamp,
        address,
        overwriteRev,
      };
    } else if (uploadSessionId) {
      data = {
        title,
        photos: finalS3Keys,
        description,
        lngLat,
        uploadSessionId,
        address,
        overwriteRev,
      };
    } else {
      throw new Error("bad place data");
    }
    const respData = await savePlace(data);
    // Redirect to new location
    setCanLeavePage(true);
    if (respData === null) {
      setRedirectUrl(`/`);
    } else {
      const { id, isDraft } = respData;
      setRedirectUrl(`/places/${id}/${isDraft ? "draft" : ""}`);
    }
  };

  const onAddFilesClick: JSX.MouseEventHandler<HTMLButtonElement> = () => {
    fileInputRef.current!.click();
  };

  const onFileInputChange: JSX.GenericEventHandler<HTMLInputElement> = () => {
    // Add new photos to state
    const fileList = fileInputRef.current!.files;
    const files = Array.from(fileList || []);
    const newPhotos = files.map((file) => ({
      id: crypto.randomUUID(),
      url: URL.createObjectURL(file),
      file,
    }));
    setPhotos((prevPhotos) => [...newPhotos, ...prevPhotos]);
    // Reset input
    fileInputRef.current!.value = "";
  };

  const onAddressTypeChange = (type: AddressType) => {
    // Set selected address type
    setAddress((a) => ({
      ...(a as Address),
      current: type,
    }));
  };

  const onCustomAddressChange: JSX.GenericEventHandler<HTMLInputElement> = (
    ev,
  ) => {
    // Set custom address
    setAddress((a) => ({
      ...(a as Address),
      custom: ev.currentTarget.value,
    }));
  };

  const onPhotoRemove = (id: string) => {
    // Remove photo from state
    setPhotos((prev) => prev.filter((p) => p.id !== id));
  };

  const pageUnloadListener = (ev: BeforeUnloadEvent) => {
    // Prevent page leave
    ev.preventDefault();
  };

  useEffect(() => {
    // Find LngLat when creating place, or if all initial photos removed
    if (!editedPlace || areInitialPhotosRemoved) {
      findFirstLngLat(photos).then((newVal) => {
        setLngLat((p) => {
          prevLngLatRef.current = p;
          return newVal;
        });
      });
    }
    // Set validity of file input element
    const validityMsg = photos.length ? "" : "Добави снимки";
    fileInputRef.current?.setCustomValidity(validityMsg);
  }, [photos]);

  useEffect(() => {
    // Update address on lngLat change
    const isLngLatChanged = `${lngLat}` !== `${prevLngLatRef.current}`;
    if (!isLngLatChanged) return;
    if (!lngLat) {
      // remove address
      setAddress(null);
    } else if (isLngLatChanged) {
      // fetch address
      setIsFetchingAddress(true);
      fetchLocationAddress(lngLat).then((data) => {
        setIsFetchingAddress(false);
        setAddress((prev) => ({
          esri: data.esri,
          here: data.here,
          custom: prev?.custom || "",
          current: "" as AddressType,
          details: data.details,
        }));
      });
    }
  }, [lngLat]);

  useEffect(() => {
    // Toogle page leave listener
    if (!canLeavePage) {
      addEventListener("beforeunload", pageUnloadListener);
      return () => removeEventListener("beforeunload", pageUnloadListener);
    }
  }, [canLeavePage]);

  useEffect(() => {
    // Set document url
    if (redirectUrl && canLeavePage) {
      window.location.href = redirectUrl;
    }
  }, [redirectUrl, canLeavePage]);

  useEffect(() => {
    // Show validity msg for title uniqueness
    if (title && title === nonUniqueTitle) {
      const msg = "Това заглавие е използвано в друг пост";
      titleInputRef.current?.setCustomValidity(msg);
      titleInputRef.current?.reportValidity();
    } else {
      titleInputRef.current?.setCustomValidity("");
    }
  }, [title, nonUniqueTitle]);

  return (
    <>
      <Head>
        <script src={asset("/exif_parser_0.1.12.js")}></script>
      </Head>
      <form onSubmit={onFormSubmit}>
        <fieldset disabled={isUploading} class="contents">
          <div class="max-w-md">
            <Label>
              Заглавие
              <Input
                elRef={titleInputRef}
                type="text"
                value={title}
                onInput={(e) => setTitle(e.currentTarget.value)}
                required
                autocomplete="off"
              />
            </Label>
            <Label>
              <span>
                Допълнение <small>(не е задължително)</small>
              </span>
              <TextArea
                value={description}
                onInput={(e) => setDescription(e.currentTarget.value)}
                rows={3}
                autocomplete="off"
              >
              </TextArea>
            </Label>
            <Label>
              Снимки
              <input
                type="file"
                accept="image/jpeg"
                multiple
                ref={fileInputRef}
                onInput={onFileInputChange}
                class="pointer-events-none absolute w-[145px] h-[27px] mt-[28px] opacity-0 overflow-hidden"
              />
              <span class="flex items-center gap-1">
                <Button
                  type="button"
                  size="sm"
                  disabled={isLoadingPhotos}
                  onClick={onAddFilesClick}
                >
                  Избери снимки…
                </Button>
                {isLoadingPhotos && <Spinner />}
              </span>
            </Label>
          </div>

          {photos.length > 0 && (
            <FormGallery
              items={photos}
              isDisabled={isUploading}
              onRemoveItem={onPhotoRemove}
              onLoadingChange={setIsLoadingPhotos}
              onSortChange={sortPhoto}
            />
          )}
          {(!photos.length || (!isLoadingPhotos && lngLat === undefined)) && (
            <p>
              Добави поне една снимка, която съдържа GPS координати.
            </p>
          )}
          {lngLat === null && addedFiles.length > 0 && (
            <p>
              <span class="bg-red-600 text-white py-1 px-2">
                {addedFiles.length > 1
                  ? "Нито една от добавените снимки"
                  : "Снимката"} не съдържа GPS координати
              </span>
            </p>
          )}
          {lngLat && (
            <FormAddress
              address={address}
              isFetchingAddress={isFetchingAddress}
              onAddressTypeChange={onAddressTypeChange}
              onCustomAddressChange={onCustomAddressChange}
              class="my-8"
            />
          )}
          <div class="flex mt-7 items-center gap-2">
            <Button class="flex gap-1.5 items-center">
              <>
                {isUploading && <Spinner />}
                {isUploading ? "Изпращане…" : "Изпрати"}
              </>
            </Button>
            {isUploading && addedFiles.length === 1 && "Снимката се изпраща"}
            {isUploading && addedFiles.length > 1 && "Снимките се изпращат"}
          </div>
          {isAdmin && editedPlace && (
            <details class="mt-5">
              <summary>Admin</summary>
              <label class="flex items-center gap-1">
                <Input
                  type="checkbox"
                  checked={overwriteRev}
                  onChange={() => setOverwriteRev((prev) => !prev)}
                />{" "}
                Overwrite rev
              </label>
            </details>
          )}
        </fieldset>
      </form>
      {errorMsg && (
        <p role="alert" class="[overflow-wrap:anywhere]">
          <Highlight type="error">{errorMsg}</Highlight>
        </p>
      )}
    </>
  );
}

async function findFirstLngLat(photos: Photo[]) {
  if (!photos.length) {
    return undefined;
  }
  for (const { file } of photos) {
    if (!file) continue;
    try {
      const buffer = await file.arrayBuffer();
      const parser = window.ExifParser.create(buffer);
      const { tags } = parser.parse();
      const lng = tags?.GPSLongitude;
      const lat = tags?.GPSLatitude;
      if (lng && lat) {
        return [
          Number(lng.toFixed(5)),
          Number(lat.toFixed(5)),
        ] as LngLat;
      }
    } catch (err) {
      console.error("Exif parsing error: " + err.message);
    }
  }
  return null;
}

async function uploadPhotos(
  files: File[],
): Promise<PostUploadSessionRespData | null> {
  if (!files.length) return null;
  const uploadSession = await createUploadSession({ filesCount: files.length });
  const responses = await Promise.all(
    uploadSession.uploadUrls.map((url, index) =>
      fetch(url, {
        body: files[index],
        method: "put",
      })
    ),
  );
  for (const resp of responses) {
    if (!resp.ok) {
      throw new Error(await resp.text());
    }
  }
  return uploadSession;
}

async function createUploadSession(
  reqData: PostUploadSessionReqData,
): Promise<PostUploadSessionRespData> {
  const resp = await fetch("/places/upload-session", {
    method: "POST",
    body: JSON.stringify(reqData),
  });
  return resp.json();
}

async function savePlace(
  reqData: PutPlaceReqData,
): Promise<PutPlaceRespData> {
  const resp = await fetch("/places", {
    method: "PUT",
    body: JSON.stringify(reqData),
  });
  return resp.json();
}

async function fetchLocationAddress(
  reqData: FindAddressReqData,
): Promise<FindAddressRespData> {
  const resp = await fetch("/places/find-address", {
    method: "POST",
    body: JSON.stringify(reqData),
  });
  return resp.json();
}
