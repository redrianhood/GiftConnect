const HEROKU_API_ROOT_URL = 'http://localhost:3000'
const PROFILE_URL = `${HEROKU_API_ROOT_URL}/userprofile`;
// 'https://giftlist-sde-api.herokuapp.com'
// 'http://localhost:3000'
// '/userprofile'


// POST/CREATE
document.getElementById('gift-form').addEventListener('submit', eventObj => {
  eventObj.preventDefault();

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


// PUT/UPDATE
let editBtns = document.getElementsByClassName('edit-btn');

for (let editBtn of editBtns){
  editBtn.addEventListener('click', editEntry);
}

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
  let newGiftName = prompt('New Gift Name and Picture?');
  let newRecipient = prompt('New Recipient');
  let newLink = prompt('New Link?');
  let newDate = prompt('New Delivery Date?');

  
  // update newGift data
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
  
  // create newGift
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


// DELETE
let deleteBtns = document.getElementsByClassName('delete-btn')

for (let deleteBtn of deleteBtns){
  deleteBtn.addEventListener('click', deleteEntry)
}

function deleteEntry(eventObj){
  
  const id = eventObj.target.getAttribute('DBid');
  const deleteURL = `${PROFILE_URL}/${id}`

  fetch(deleteURL, { method: 'DELETE' })
  .then( _ => {
    window.location.reload();
  })
  .catch(error => console.log(error));
} 