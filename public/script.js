const HEROKU_API_ROOT_URL = 'http://localhost:3000'
// 'https://giftlist-sde-api.herokuapp.com/'
// 'http://localhost:3000'
// '/userprofile'
const PROFILE_URL = `${HEROKU_API_ROOT_URL}/userprofile`;


// POST/CREATE
document.getElementById('gift-form').addEventListener('submit', eventObj => {
  eventObj.preventDefault();  // currently prevents required on input

  const giftName = document.getElementById('giftName').value;
  const recipient = document.getElementById('recipient').value;
  const link = document.getElementById('link').value;
  let date = document.getElementById('date').value;

  if (date === undefined || date.length === 0){
    date = ''; 
  }
  
  const giftEntry = { giftName, recipient, link, date }
  
  fetch(PROFILE_URL, {
    method: 'POST',
    redirect: 'follow',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(giftEntry)
  })
  // .then(res => {
  //   if (res.ok) return res.text()
  // })
  .then( html => {
    //document.writeln(html)
    window.location.reload();
  })
  .catch(error => console.log(error));
})


document.getElementById("edit-btn").addEventListener('click', editEntry)
// PUT/UPDATE
function editEntry(eventObj) {
  const editBtn = eventObj.target;
  const card = editBtn.closest('.card');
  const id = editBtn.getAttribute('DBid');
  
  // oldGift data for comparison and setting logic  
  const oldGiftName = card.children[0].innerText;
  const oldRecipient = card.children[2].children[0].innerText.slice(5);
  const oldLink = card.children[3].children[0].href; 
  const oldDate = card.children[2].children[1].children[0].innerText.slice(4); 

  // newGift data from user  
  // fancy prompt? https://code.daypilot.org/17463/javascript-prompt-replacement
  let newGiftName = prompt('New Gift Name and Picture?');
  let newRecipient = prompt('New Recipient');
  let newLink = prompt('New Link?');
  let newDate = prompt('New Delivery Date?');

  
  // Comparing oldGift to newGift data
  if (newGiftName === undefined || newGiftName === null || newGiftName.length === 0){
    newGiftName = oldGiftName;
  }
  if (newRecipient === undefined || newRecipient === null || newRecipient.length === 0){
    newRecipient = oldRecipient;
  }
  if (newLink === undefined || newLink === null || newLink.length === 0){
    newLink = oldLink;
  }
  if (newDate === undefined || newDate === null || newDate.length === 0){
    newDate = oldDate;
  }
  
  const newGift = {
    _id: id,
    giftName: newGiftName, 
    recipient: newRecipient,
    link: newLink,
    date: newDate 
  }

  // locations to update card
  const nameLoc = card.children[0];
  const recipientLoc = card.children[2].children[0];
  const linkLoc = card.children[3].children[0]; 
  const dateLoc = card.children[2].children[1].children[0]; 

  fetch(PROFILE_URL, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(newGift)
  })
  // IDEALLY 
  // we can ace this and replace with redirect('/userprofile')
  // when we sort out why it doesn't work
  .then(res => res.json())
  .then(data => {
    nameLoc.innerHTML = data.giftName;
    recipientLoc.innerText = 'For: ' + data.recipient;
    linkLoc.setAttribute('href', newLink);
    dateLoc.innerText = 'On: ' + data.date;

  })
  .catch(error => console.log(error));

}

document.getElementById("delete-btn").addEventListener('click', deleteEntry)
// DELETE
function deleteEntry(eventObj){
  // prompt "are you sure?"
  
  const id = eventObj.target.getAttribute('DBid');
  const deleteURL = `${PROFILE_URL}/${id}`

  fetch(deleteURL, { method: 'DELETE' })
  .then( _ => {
    window.location.reload();
  })
  .catch(error => console.log(error));
  // .then(res => res.json())
  // //.then(data => renderGifts(data))
  // .catch(error => console.log(error));
} 





// BEFORE EJS - KEEP FOR REFERENCE UNTIL LATER
// To render the Bootstrap Card components
// function renderGifts(gifts) {
//   const giftContainer = document.getElementById('gift-container');
//   giftContainer.innerHTML = "";


//   for (const gift of gifts) {
//     const { _id, giftName, recipient, link, date, photo } = gift;

//     const card = document.createElement('div')
//     card.classList.add('card');
//     card.style.width = '18rem';

//     card.innerHTML = `
// <h4 class="card-header">${giftName}</h4> 
// <img src="${photo}" class="card-img-top" alt="${giftName}">
// <div class="card-body">
//   <h5 class="card-title">For: ${recipient}</h5>
//     <ul class="list-group list-group-flush">
//       <li class="list-group-item">On: ${date}</li>
//       <li class="list-group-item">Last known price: ??</li>
//   </ul>
//   </div>
// <div id="${_id}" class="card-body">
//   <a href="${link}" id="card-links">Buy Now</a>
// </div>`;

//     giftContainer.appendChild(card);

//     // add buttons
//     const editBtn = document.createElement('btn');
//     editBtn.classList.add('btn', 'btn-info');
//     editBtn.setAttribute('DBid', _id);
//     editBtn.innerHTML = "Edit";
//     editBtn.addEventListener('click', editEntry);

//     const deleteBtn = document.createElement('btn');
//     deleteBtn.classList.add('btn', 'btn-danger');
//     deleteBtn.setAttribute('DBid', _id);
//     deleteBtn.innerHTML = "X";
//     deleteBtn.addEventListener('click', deleteEntry);

//     document.getElementById(`${_id}`).append(editBtn);
//     document.getElementById(`${_id}`).append(deleteBtn);
//   }
//}

// GET/READ
// fetch(PROFILE_URL)
//   .then(res => {
//     console.log(res);
//     res.json();
//   })
//   // .then(gifts => {
//   //    renderGifts(gifts);
//   //  })
//   .catch(error => {
//     console.log(error);
//   })