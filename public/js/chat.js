const socket = io()
// Elements
const $messageForm = document.querySelector('#message-form')
const $messageFormInput = $messageForm.querySelector('input')
const $messageFormButton = $messageForm.querySelector('button')
const $locationButton = document.querySelector('#send-location')
const $messages = document.querySelector('#messages')
// Templates
const messageTemplate = document.querySelector('#message-template').innerHTML
const locationTemplate = document.querySelector('#location-message-template').innerHTML
const sidebarTemplate = document.querySelector('#sidebar-template').innerHTML
// Options
const {username, room} = Qs.parse(location.search, {ignoreQueryPrefix: true})
const autoscroll = () => {
    // 
    const $newMessage = $messages.lastElementChild
    // Height of the new message
    const newMessageStyles = getComputedStyle($newMessage)
    const newMessageMargin = parseInt(newMessageStyles.marginBottom)
    const newMessageHeight  = $newMessage.offsetHeight + newMessageMargin

    // visible height
    const visibleHeight = $messages.offsetHeight
    // height of messages container
    const containerHeight = $messages.scrollHeight
    // how far have i scrolled
    const scrollOffset = $messages.scrollTop + visibleHeight
    if(containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
    
}
socket.on('message', (message) => {
    const html = Mustache.render(messageTemplate, {
        text: message.text,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
const input = document.getElementById('io-message')
$messageForm.addEventListener('submit', (e) => {
    e.preventDefault()
    //disable
    $messageFormButton.setAttribute('disabled', 'disabled')
    socket.emit('clientMessage',input.value, (error) => {
        //enable
        $messageFormButton.removeAttribute('disabled')
        $messageFormInput.value = ''
        $messageFormInput.focus()
        if(error) return console.log(error)
        console.log('Message delivered')
    })
})
document.querySelector('#send-location').addEventListener('click', (e) => {
    $locationButton.setAttribute('disabled', 'disabled')
    if(!navigator.geolocation){
        return alert('Geolocation is not supported by your browser.')
    }
    navigator.geolocation.getCurrentPosition((position) => {
        socket.emit('sendLocation',{latitude: position.coords.latitude, longitude: position.coords.longitude}, () => {
            $locationButton.removeAttribute('disabled')
            console.log('Location delivered')
        })
    })
})

socket.on('locationMessage', (message) => {
    const html = Mustache.render(locationTemplate, {
        url: message.url,
        createdAt: moment(message.createdAt).format('h:mm a'),
        username: message.username
        
    })
    $messages.insertAdjacentHTML('beforeend', html)
    autoscroll()
})
socket.emit('join', {username, room}, (error) => {
    if(error) {
        alert(error)
        location.href = '/'
    }
})
socket.on('roomData', ({room, users})=> {
  const html = Mustache.render(sidebarTemplate, {
      room, 
      users
  })
  document.querySelector('#sidebar').innerHTML = html
})