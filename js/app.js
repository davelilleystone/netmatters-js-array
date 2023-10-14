const apiUrl = "https://api.unsplash.com/photos/random/?count=1&orientation=landscape";
const baseUrl = "https://unsplash.com/photos";
let currentImageData = {};
const savedImageContainer = document.querySelector(".saved-image-container");
const mainImageContainer = document.querySelector(".main-image-container");
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

    loadSavedImages();
  }
  // fire change event on select so we can show saved images for the first email in the list
  // fireSelectChangeEvent(emailSelect);
  //   displayImage(apiUrl, mainImageContainer);
};

// save image to account and add to saved images container on page

onSaveImageHandler = (e) => {
  if (!checkEmailOnSave(emailSelect)) {
    return console.log("No email selected");
  }

  if (!checkMainImageExists()) {
    return console.log("No image to save");
  }
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const image = getCurrentImageData();

  if (checkImageIsSaved(image, account)) {
    return console.log("Image already saved");
  }
  saveImageToAccount(account, image);
  const savedImage = createSavedImage(currentImageData, ["pic-wrapper", "saved-image"]);
  const overLay = createSavedItemOverlay();
  const wrappedOverLay = createDivWrapper(overLay, ["saved-image-overlay"]);
  savedImage.insertAdjacentElement("beforeend", wrappedOverLay);
  addImageToDom(savedImage, savedImageContainer);
};

/********************/
/* Helper functions */
/********************/

// check if main image exists on page
const checkMainImageExists = () => {
  return mainImageContainer.querySelector(".main-image-container > .pic-wrapper") ? true : false;
};

// get the current image data - updates on each search
const getCurrentImageData = () => {
  return currentImageData;
};

// store the current image data
const setCurrentImageData = (imageData) => {
  currentImageData = imageData;
};

const createSavedImage = (imageData, classList) => {
  const image = createImage(imageData, "saved");
  return createDivWrapper(image, classList);
};

const createDivWrapper = (element, classList) => {
  const div = document.createElement("div");
  div.classList.add(...classList);
  div.innerHTML = element;
  return div;
};

const createSearchUrl = () => {
  const searchTerm = searchInput.value.trim();
  return (url = searchTerm != "" ? `${apiUrl}&query=${encodeURIComponent(searchTerm)}` : apiUrl);
};

// return current search term
const getSearchTerm = () => {
  return searchInput.value.trim();
};

// load saved images for selected email
const loadSavedImages = () => {
  const account = getAccountFromLocalStorage(getEmailFromSelect());
  const parent = savedImageContainer;
  const images = account.images;
  if (images.length === 0) {
    return;
  }
  images.forEach((image) => {
    const wrappedImage = createSavedImage(image, ["pic-wrapper", "saved-image"]);
    addImageToDom(wrappedImage, parent);
  });
};

// clear saved images container
const clearSavedImages = () => {
  if (savedImageContainer.hasChildNodes()) {
    savedImageContainer.innerHTML = "";
  }
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

const createImage = (imageData, type) => {
  const {
    id,
    alt_description: altDescription,
    urls: { regular },
    urls: { small },
  } = imageData;
  const image = `<picture>
      ${type === "new" ? `<source media="(min-width:768px)" srcset="${regular}">` : ""}
      <img src="${small}" data-pic-id=${id} alt="${altDescription}">
  </picture>`;
  return image;
};

const addImageToDom = (image, parent) => {
  parent.insertAdjacentElement("afterbegin", image);
};

/* display the image on the page - only passing in zero or one argument for now 
depending on if the user has entered a search term */

const onSearchSubmitHandler = async () => {
  const parent = mainImageContainer;
  const url = createSearchUrl();

  // remove existing image from page
  if (checkMainImageExists()) {
    mainImageContainer.removeChild(mainImageContainer.firstChild);
  }

  try {
    const [imageData] = await getImageData(url);
    setCurrentImageData(imageData);
    const image = createImage(imageData, "new");
    const wrappedImage = createDivWrapper(image, ["pic-wrapper"]);
    addImageToDom(wrappedImage, parent);
  } catch (err) {
    if (err === 404) {
      console.log(`No images for ${getSearchTerm()} found`);
    } else {
      console.log(err);
    }
  }
};

// add event listeners

// display image on page load

// window.addEventListener("DOMContentLoaded", displayImage);

// display image on button click

searchForm.addEventListener("submit", (e) => {
  e.preventDefault();
  onSearchSubmitHandler();

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
  // TODO - clear input field only after email has been added successfully
  emailInput.value = "";
});

emailSelect.addEventListener("change", (e) => {
  // remove existing images from saved images container
  clearSavedImages();
  loadSavedImages();
});

window.addEventListener("DOMContentLoaded", () => {
  onPageLoadHandler();
});

savedImageContainer.addEventListener("click", (e) => {
  console.dir(e.target);
  if (e.target.classList.contains("pic-wrapper")) {
    console.log("clicked");
  }
});

createSavedItemOverlay = () => {
  const overLay = `
  <span class="view-on-unsplash">View on Unsplash</span>
  <span class="remove-saved">Remove From Saved</span>
  `;
  return overLay;
};
