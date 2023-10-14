const apiUrl = "https://api.unsplash.com/photos/random/?count=1&orientation=landscape";
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

/********************/
/* Handler functions */
/********************/

// on page load handler

onPageLoadHandler = () => {
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
};

// save image to account and add to saved images container on page

onSaveImageHandler = (e) => {
  console.log("save image handler");
  if (!checkEmailOnSave(emailSelect)) {
    return console.log("No email selected");
  }
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const image = getCurrentImageData();

  if (checkImageIsSaved(image, account)) {
    return console.log("Image already saved");
  }
  saveImageToAccount(account, image);
};

/********************/
/* Helper functions */
/********************/

// check if main image exists on page
const checkMainImageExists = () => {
  return photoContainer.querySelector(".main-image") ? true : false;
};

// get the current image data - updates on each search
const getCurrentImageData = () => {
  return currentImageData;
};

// store the current image data
const setCurrentImageData = (imageData) => {
  currentImageData = imageData;
};

/********************/
/* Select functions */
/********************/

/* fire change event on select - example use is when emails are 
added to select list on page load, this event is fired so that 
we can call the handler that loads a users stored images */

const fireSelectChangeEvent = (select) => {
  select.dispatchEvent(new Event("change"));
};

// remove default option from select list - default option is used to show placeholder text
const removeDefaultOption = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  if (defaultOption) {
    emailSelect.removeChild(defaultOption);
  }
};

// check if default option exists in select list
const checkDefaultOptionExists = () => {
  const defaultOption = emailSelect.querySelector("option[value='default-option']");
  return defaultOption ? true : false;
};

// set selected option in select list
const setSelected = (select, value) => {
  for (let i = 0; i < select.options.length; i++) {
    if (select.options[i].value === value) {
      select.options[i].selected = true;
      return;
    }
  }
};

// get selected email from select list
getEmailFromSelect = () => {
  return emailSelect.value;
};

/*******************/
/* Email functions */
/*******************/

// get all email addresses from local storage
const getEmailAddresses = () => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.map((account) => account.email);
};

// check if any email addresses exist in select list
const checkEmailOnSave = (email) => {
  if (checkDefaultOptionExists()) {
    return false;
  }
  return getEmailFromSelect();
};

// check if email syntax is valid
const checkEmailIsValid = (email) => {
  const emailRegex = new RegExp(/^[a-zA-Z0-9._\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,6}$/);
  return emailRegex.test(email);
};

// check if submitted email already exists
const checkEmailExists = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.some((account) => account.email === email.toLowerCase());
};

// add email to select list
const addEmailToSelect = (email) => {
  const option = document.createElement("option");
  option.value = email;
  option.textContent = email;
  emailSelect.appendChild(option);
};

// check if email syntax is valid and does not already exist
const validateEmail = (email) => {
  // check if email syntax is valid
  if (!checkEmailIsValid(email)) {
    console.log("Email is not valid");
    return false;
  }

  // check if email exists in local storage
  if (checkEmailExists(email)) {
    console.log("Email already exists");
    return false;
  }

  return true;
};

const addEmail = (email) => {
  // validate email
  if (!validateEmail(email)) {
    console.log("Email is not valid");
    return;
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

/*********************/
/* Account Functions */
/*********************/

// add account to local storage
const addAccountToLocalStorage = (account) => {
  const accounts = getAccountsFromLocalStorage();
  accounts.push(account);
  localStorage.setItem("accounts", JSON.stringify(accounts));
};

// check if image has already been saved to account
const checkImageIsSaved = (image, account) => {
  if (account.images.some((savedImage) => savedImage.id === image.id)) {
    return true;
  }
  return false;
};

const createAccount = (email) => {
  return { email: email.toLowerCase(), images: [] };
};

// get single account from local storage
const getAccountFromLocalStorage = (email) => {
  const accounts = getAccountsFromLocalStorage();
  return accounts.find((account) => account.email === email);
};

// get all accounts from local storage
const getAccountsFromLocalStorage = () => {
  const accounts = localStorage.getItem("accounts") ? JSON.parse(localStorage.getItem("accounts")) : [];
  return accounts;
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
    const [imageData] = await getImageData(url);
    const image = createImage(imageData);
    console.log(imageData);
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
  const url = searchTerm != "" ? `${apiUrl}&query=${encodeURIComponent(searchTerm)}` : apiUrl;
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
  onPageLoadHandler();
});

const saveImageToAccount = (account, image) => {
  account.images.push(image);
  updateAccountInLocalStorage(account);
};

const updateAccountInLocalStorage = (account) => {
  const accounts = getAccountsFromLocalStorage();
  const index = accounts.findIndex((acc) => acc.email === account.email);
  accounts[index] = account;
  localStorage.setItem("accounts", JSON.stringify(accounts));
};
