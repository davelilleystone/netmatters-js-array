const apiUrl = "https://api.unsplash.com/photos/random";
const baseUrl = "https://unsplash.com/photos";
let currentImageData = {};

const photoContainer = document.querySelector(".photo-container");
const searchInput = document.querySelector(".search-input");
const searchForm = document.querySelector(".search-form");
const emailForm = document.querySelector(".add-email-form");
const emailInput = document.querySelector(".add-email-input");
const emailSelect = document.querySelector(".email-select");

// turn off browser validation for email input

emailForm.noValidate = true;

getEmailFromSelect = () => {
  return emailSelect.value;
};

saveImageToAccount = (account, image) => {
  account.images.push(image);
  const accounts = getAccountsFromLocalStorage();
  for (let i = 0; i < accounts.length; i++) {
    if (accounts[i].email === account.email) {
      accounts[i] = account;
    }
  }
  localStorage.setItem("accounts", JSON.stringify(accounts));
};

onSaveImageHandler = (e) => {
  if (!checkEmailOnSave(emailSelect)) {
    return console.log("No email selected");
  }
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const image = getCurrentImageData();

  // check if image is already saved
  if (account.images.some((savedImage) => savedImage.id === image.id)) {
    return console.log("Image already saved");
  }
  saveImageToAccount(account, image);
};

const checkMainImageExists = () => {
  return photoContainer.querySelector(".main-image") ? true : false;
};

const getCurrentImageData = () => {
  return currentImageData;
};

const setCurrentImageData = (imageData) => {
  currentImageData = imageData;
};

const getEmailAddresses = () => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.map((account) => account.email);
};

const setSelected = (select, value) => {
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === value) {
      select.options[i].selected = true;
      return;
    }
  }
};

const fireSelectChangeEvent = (select) => {
  select.dispatchEvent(new Event("change"));
};

const removeDefaultOption = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  if (defaultOption) {
    emailSelect.removeChild(defaultOption);
  }
};

const checkDefaultOptionExists = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  return defaultOption ? true : false;
};

// add email to select list

const checkEmailOnSave = (email) => {
  if (checkDefaultOptionExists()) {
    return false;
  }
  return getEmailFromSelect();
};

const checkEmailIsValid = (email) => {
  const emailRegex = new RegExp(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/);
  return emailRegex.test(email);
};

const checkEmailExists = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.some((account) => account.email === email.toLowerCase());
};

const addEmailToSelect = (email) => {
  const option = document.createElement("option");
  option.value = email;
  option.textContent = email;
  emailSelect.appendChild(option);
};

const createAccount = (email) => {
  return { email: email.toLowerCase(), images: [] };
};

const addAccountToLocalStorage = (account) => {
  const accounts = getAccountsFromLocalStorage();
  accounts.push(account);
  localStorage.setItem("accounts", JSON.stringify(accounts));
};

const getAccountsFromLocalStorage = () => {
  const accounts = localStorage.getItem("accounts") ? JSON.parse(localStorage.getItem("accounts")) : [];
  return accounts;
};

const getAccountFromLocalStorage = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.find((account) => account.email === email);
};

const addEmail = (email) => {
  // check if email is valid
  if (!checkEmailIsValid(email)) {
    return console.log("Email is not valid");
  }

  // check if email exists in local storage
  if (checkEmailExists(email)) {
    return console.log("Email already exists");
  }
  // email is ok, create account
  const account = createAccount(email);

  // add account to local storage
  addAccountToLocalStorage(account);

  // add account email to select list
  addEmailToSelect(email);

  // remove default option if it exists
  if (checkDefaultOptionExists()) {
    removeDefaultOption();
  }

  //  set this email to selected
  setSelected(emailSelect, email);
  // fire change event on select
  fireSelectChangeEvent(emailSelect);
};

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
0;

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
  image.classList.add("main-image");
  return image;
};

const addImageToDom = (image, parent) => {
  parent.appendChild(image);
};

/* display the image on the page - only passing in zero or one argument for now 
depending on if the user has entered a search term */

const displayImage = async (url, parent) => {
  try {
    const imageData = await getImageData(url);
    const image = createImage(imageData);
    addImageToDom(image, parent);
    setCurrentImageData(imageData);
  } catch (err) {
    console.log(err);
  }
};

// add event listeners

// display image on page load

// window.addEventListener("DOMContentLoaded", displayImage);

// display image on button click

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  if (checkMainImageExists()) {
    photoContainer.removeChild(photoContainer.firstChild);
  }
  const searchTerm = searchInput.value.trim();
  const url = searchTerm != "" ? `${apiUrl}?query=${encodeURIComponent(searchTerm)}` : apiUrl;
  displayImage(url, photoContainer);
  //   searchInput.value = "";
});

searchForm.addEventListener("click", (e) => {
  if (e.target.id === "save-button") {
    onSaveImageHandler(e);
  }
});

emailForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const email = emailInput.value.trim();
  addEmail(email);
  emailInput.value = "";
});

emailSelect.addEventListener("change", (e) => {
  console.log("Show saved images for " + e.target.value);
});

window.addEventListener("DOMContentLoaded", () => {
  // check if account array exists in local storage - if not, create it
  if (!localStorage.getItem("accounts")) {
    localStorage.setItem("accounts", JSON.stringify([]));
  }
  // if no accounts exist,  no need to load select list
  if (getAccountsFromLocalStorage().length === 0) {
    return;
  } else {
    const emailAddresses = getEmailAddresses();
    removeDefaultOption();
    emailAddresses.sort().forEach((email) => {
      addEmailToSelect(email);
    });
  }
  // fire change event on select so we can show saved images for the first email in the list
  fireSelectChangeEvent(emailSelect);
  //   displayImage(apiUrl, photoContainer);
});
