const apiUrl = "https://api.unsplash.com/photos/random";
const baseUrl = "https://unsplash.com/photos";
const photoContainer = document.querySelector(".photo-container");
const searchBtn = document.querySelector(".search-btn");
const searchInput = document.querySelector(".search-input");
// not sure if we need this
const searchForm = document.querySelector(".search-form");

/*
Fetches JSON data from the given url - if the response is ok, 
it returns the JSON data, otherwise it returns a rejected promise.
*/

const getJson = async (url) => {
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: "Client-ID AGXrZudMPTQjYsYx-Nm7S6JrR_0slnKlmu6ctmxZTaU",
    },
  });
  if (!response.ok) {
    return Promise.reject(response.status);
  }
  return await response.json();
};

const getImageData = async (url) => {
  try {
    return await getJson(url);
  } catch (err) {
    return Promise.reject(err);
  }
};

const createImage = (imageData) => {
  const image = document.createElement("img");
  image.src = imageData.urls.regular;
  image.setAttribute("alt", imageData.alt_description);
  image.setAttribute("data-photo-id", imageData.id);
  return image;
};

const addImageToDom = (image) => {
  photoContainer.appendChild(image);
};

/* display the image on the page - only passing in zero or one argument for now 
depending on if the user has entered a search term */

const displayImage = async (...query) => {
  const url = query.length > 0 ? `${apiUrl}?query=${encodeURIComponent(query[0])}` : apiUrl;
  try {
    const imageData = await getImageData(url);
    const image = createImage(imageData);
    addImageToDom(image);
    console.log(imageData);
  } catch (err) {
    console.log(err);
  }
};

// add event listeners

// display image on page load

window.addEventListener("DOMContentLoaded", displayImage);

// display image on button click

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  photoContainer.removeChild(photoContainer.firstChild);
  const searchTerm = searchInput.value;
  displayImage(searchTerm);
  searchInput.value = "";
});
