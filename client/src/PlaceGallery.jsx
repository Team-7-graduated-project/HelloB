import { useState, useEffect } from "react";
import PropTypes from "prop-types";

export default function PlaceGallery({ place }) {
  const [showAllPhotos, setShowAllPhotos] = useState(false);

  useEffect(() => {}, [place.photos]);

  if (showAllPhotos) {
    return (
      <div className="fixed inset-0 bg-black text-white min-h-screen z-[60]">
        <div className="sticky top-0 bg-black py-4 z-[61]">
          <div className="flex justify-between items-center max-w-6xl mx-auto px-8">
            <h2 className="text-3xl">Photos of {place.title}</h2>
            <button
              onClick={() => {
                setShowAllPhotos(false);
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className="flex max-w-24 items-center gap-1 py-2 px-4 rounded-2xl shadow shadow-black bg-white text-black hover:bg-gray-100 transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className="size-6"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="m9.75 9.75 4.5 4.5m0-4.5-4.5 4.5M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"
                />
              </svg>
              Close
            </button>
          </div>
        </div>

        <div className="overflow-y-auto h-[calc(100vh-88px)]">
          <div className="max-w-6xl mx-auto px-8 py-4">
            {place?.photos?.length > 0 &&
              place.photos.map((photo) => (
                <div key={photo} className="mb-8">
                  <img
                    src={photo}
                    alt={place.title}
                    className="w-full rounded-lg"
                    loading="lazy"
                  />
                </div>
              ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div className="grid gap-2 grid-cols-[2fr_1fr] rounded-2xl overflow-hidden">
        <div>
          {place.photos?.[0] && (
            <div>
              <img
                onClick={() => setShowAllPhotos(true)}
                className="aspect-square cursor-pointer object-cover hover:opacity-90 transition-opacity"
                src={place.photos[0]}
                alt={place.title}
              />
            </div>
          )}
        </div>
        <div className="grid">
          {place.photos?.[1] && (
            <img
              onClick={() => setShowAllPhotos(true)}
              className="aspect-square cursor-pointer object-cover hover:opacity-90 transition-opacity"
              src={place.photos[1]}
              alt={place.title}
            />
          )}
          <div className="overflow-hidden">
            {place.photos?.[2] && (
              <img
                onClick={() => setShowAllPhotos(true)}
                className="aspect-square cursor-pointer object-cover relative top-2 hover:opacity-90 transition-opacity"
                src={place.photos[2]}
                alt={place.title}
              />
            )}
          </div>
        </div>
      </div>
      <button
        onClick={() => setShowAllPhotos(true)}
        className="flex max-w-52 gap-1 absolute bottom-2 right-2 py-2 px-4 bg-white rounded-2xl shadow-md hover:bg-gray-100 transition-colors"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="currentColor"
          className="size-6"
        >
          <path
            fillRule="evenodd"
            d="M1.5 6a2.25 2.25 0 0 1 2.25-2.25h16.5A2.25 2.25 0 0 1 22.5 6v12a2.25 2.25 0 0 1-2.25 2.25H3.75A2.25 2.25 0 0 1 1.5 18V6ZM3 16.06V18c0 .414.336.75.75.75h16.5A.75.75 0 0 0 21 18v-1.94l-2.69-2.689a1.5 1.5 0 0 0-2.12 0l-.88.879.97.97a.75.75 0 1 1-1.06 1.06l-5.16-5.159a1.5 1.5 0 0 0-2.12 0L3 16.061Zm10.125-7.81a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0Z"
            clipRule="evenodd"
          />
        </svg>
        Show more photos
      </button>
    </div>
  );
}

PlaceGallery.propTypes = {
  place: PropTypes.shape({
    title: PropTypes.string.isRequired,
    photos: PropTypes.arrayOf(PropTypes.string).isRequired,
  }).isRequired,
};
