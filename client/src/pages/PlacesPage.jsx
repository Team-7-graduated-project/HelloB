import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import axios from "axios";
import PlaceImg from "../PlaceImg";

export default function PlacesPage() {
  const [places, setPlaces] = useState([]);

  useEffect(() => {
    axios.get("/host/user-places").then(({ data }) => {
      setPlaces(data);
    });
  }, []);

  return (
    <div className="p-6">
      <div className="text-center mb-6">
        <Link
          className="inline-flex gap-1 bg-primary text-white py-2 px-6 rounded-full"
          to={"/host/places/new"}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={1.5}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 4.5v15m7.5-7.5h-15"
            />
          </svg>
          Add New Places
        </Link>
      </div>

      <div className="grid sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {places.length > 0 ? (
          places.map((place) => (
            <Link
              to={`/host/places/${place._id}`} // Use _id for routing
              key={place._id} // Ensure unique key using _id
              className="flex flex-col bg-gray-200 rounded-2xl overflow-hidden p-4 hover:shadow-lg transition-shadow duration-300"
            >
              <div className="w-full h-60 mb-4">
                <PlaceImg place={place} />
              </div>
              <div className="py-3 grow pr-3">
                <h2 className="text-xl font-semibold truncate">
                  {place.title}
                </h2>
                <p className="text-sm mt-1 text-gray-600 truncate">
                  {place.description}
                </p>
              </div>
            </Link>
          ))
        ) : (
          <p className="text-gray-600 mt-4">No places available.</p>
        )}
      </div>
    </div>
  );
}
