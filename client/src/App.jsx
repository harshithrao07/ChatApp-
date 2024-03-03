import React, { useEffect, useRef, useState } from 'react'
import io from 'socket.io-client'
import { Button, IconButton } from '@material-tailwind/react'

// connects to socket in backend
const socket = io('http://localhost:3000')

const App = () => {
  const [privateChats, setPrivateChats] = useState(new Map())
  const [publicChats, setPublicChats] = useState([])
  const [tab, setTab] = useState("#CHATROOM")
  const [join, setJoin] = useState(false)
  const [userData, setUserData] = useState({
    username: "",
    receivername: "",
    connected: false,
    message: ""
  })

  const chatEndRef = useRef(null);
  const chatContainerRef = useRef(null);

  // scrolls to bottom of chat page whenever user sends message
  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Effect to scroll to bottom whenever publicChats and privateChats changes
  useEffect(() => {
    scrollToBottom();
  }, [publicChats, privateChats]);

  // adds a scrollbar whenever the text becomes long
  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
      const isScrollable = chatContainer.scrollHeight > chatContainer.clientHeight;
      chatContainer.classList.toggle('overflow-y-scroll', isScrollable);
    }
  }, [publicChats, privateChats, join]);

  // handles username input
  const handleUsername = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, "username": value });
    sessionStorage.setItem("username", value)
  }

  // after user gives his username
  const handleSubmit = () => {
    setUserData({
      ...userData,
      "connected": true
    })
    userJoin()
  }

  // whenever a new user joins
  const userJoin = () => {
    var chatMessage = {
      senderName: userData.username,
      status: "JOIN"
    };
    setJoin(!join);
    socket.emit("app/message", chatMessage);
  }

  // handles message input
  const handleMessage = (event) => {
    const { value } = event.target;
    setUserData({ ...userData, "message": value });
  }

  // sends public message
  const sendValue = () => {
    var chatMessage = {
      senderName: userData.username,
      message: userData.message,
      status: "MESSAGE"
    };
    if (chatMessage.message !== "") {
      socket.emit('app/message', chatMessage)
      setUserData({ ...userData, "message": "" })
    }
    scrollToBottom()
  }

  // receiving public message
  useEffect(() => {
    socket.on('app/message', (payloadData) => {
      switch (payloadData.status) {
        case "JOIN":
          if (!privateChats.get(payloadData.senderName)) {
            privateChats.set(payloadData.senderName, []);
            setPrivateChats(new Map(privateChats));
          }
          break;
        case "MESSAGE":
          publicChats.push(payloadData);
          setPublicChats([...publicChats]);
          break;
      }
    })

    return () => {
      socket.off('app/message')
    }
  }, [publicChats])


  // receivng private message
  useEffect(() => {
    socket.on("app/private-message", (payloadData) => {
      if (privateChats.get(payloadData.senderName)) {
        privateChats.get(payloadData.senderName).push(payloadData);
        setPrivateChats(new Map(privateChats));
      } else {
        let list = [];
        list.push(payloadData);
        privateChats.set(payloadData.senderName, list);
        setPrivateChats(new Map(privateChats));
      }
    })

    return () => {
      socket.off('app/private-message')
    }
  }, [privateChats])

  // sends private message
  const sendPrivateValue = () => {
    var chatMessage = {
      senderName: userData.username,
      receiverName: tab,
      message: userData.message,
      status: "MESSAGE"
    };

    if (chatMessage.message !== "") {
      if (userData.username !== tab) {
        privateChats.get(tab).push(chatMessage);
        setPrivateChats(new Map(privateChats));
      }

      socket.emit("app/private-message", chatMessage)
      setUserData({ ...userData, "message": "" })
    }
    scrollToBottom()
  }
  

  return (
    <div className='h-screen flex flex-col justify-center items-center'>
      {userData.connected ?
        <div className='grid grid-cols-5 p-5 my-10 relative w-full'>
          <div className='bar text-gray-400 rounded-l-md border-primary-100 border'>
            <ul className='cursor-pointer'>
              <li onClick={() => { setTab('#CHATROOM') }} className={`${tab === '#CHATROOM' && "active"} py-4 border-b border-primary-100`}>#CHATROOM</li>
              {
                [...privateChats.keys()].map((name, index) => (
                  <li className={`${tab === name && `active`} py-4 border-b border-primary-100`} key={index} onClick={() => { setTab(name) }}>{name === sessionStorage.getItem("username") ? name + ' (You)' : name}</li>
                ))
              }
            </ul>
          </div>
          <div className='col-span-4 bg-black border border-primary-100 rounded-r-md flex flex-col'>
            <div className='flex items-center justify-end py-3 px-8 text-2xl border-b border-b-primary-100'>
              {tab}
            </div>

            {
              tab === "#CHATROOM" &&
              <div className='flex flex-col'>
                <div ref={chatContainerRef}>
                  <ul className='h-96 mb-auto overflow-y-auto'>
                    {
                      publicChats.map((chat, index) => (
                        <li className={`flex flex-col w-full ${chat.senderName === userData.username ? 'items-end' : 'items-start'}`} key={index}>
                          <div className={`w-fit py-2 my-2 bar flex flex-col ${chat.senderName === userData.username ? `rounded-l-md items-start pr-10 pl-2` : `rounded-r-md items-end pl-10 pr-2`}`}>
                            <div className='text-[10px] cursor-default text-gray-400 border-b border-b-gray-400'>{chat.senderName === userData.username ? "You" : chat.senderName}</div>
                            <div className='mt-1 text-md'>{chat.message}</div>
                          </div>
                        </li>
                      ))
                    }
                    <div ref={chatEndRef} />
                  </ul>
                </div>

                <div className='flex justify-center items-center gap-x-4 py-1 border-t border-primary-100'>
                  <input className='w-11/12 my-auto outline-none' type='text' placeholder='Enter the message' value={userData.message} onChange={handleMessage} onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                      sendValue();
                    }
                  }} />
                  <IconButton size='md' onClick={sendValue}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </IconButton>
                </div>
              </div>
            }

            {
              tab !== "#CHATROOM" &&
              <div className='flex flex-col h-full'>
                <div ref={chatContainerRef}>
                  <ul className='h-96 mb-auto overflow-y-auto'>
                    {
                      [...privateChats.get(tab)].map((chat, index) => {
                        const isTabSender = chat.senderName === tab && chat.receiverName === userData.username;
                        const isUserSender = chat.senderName === userData.username && chat.receiverName === tab;

                        return (isTabSender || isUserSender) && (
                          <li key={index} className={`flex w-full ${chat.senderName === userData.username ? 'justify-end' : 'justify-start'}`}>
                            <div className={`w-fit py-2 my-2 bar flex flex-col ${chat.senderName === userData.username ? `rounded-l-md items-start pr-10 pl-2` : `rounded-r-md items-end pl-10 pr-2`}`}>
                              {chat.message}
                            </div>
                          </li>
                        );
                      })
                    }
                    <div ref={chatEndRef} />
                  </ul>
                </div>

                <div className='flex justify-center items-center gap-x-4 py-1 border-t border-primary-100'>
                  <input className='w-11/12 my-auto outline' type='text' placeholder='Enter the message' value={userData.message} onChange={handleMessage} onKeyPress={(event) => {
                    if (event.key === 'Enter') {
                      sendPrivateValue();
                    }
                  }} />
                  <IconButton size='md' onClick={sendPrivateValue}>
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M6 12 3.269 3.125A59.769 59.769 0 0 1 21.485 12 59.768 59.768 0 0 1 3.27 20.875L5.999 12Zm0 0h7.5" />
                    </svg>
                  </IconButton>
                </div>
              </div>
            }
          </div>
        </div>
        :
        <div className='flex flex-col items-center justify-center w-full'>
          <form className='flex flex-col w-1/3 p-5 rounded-lg bar'>
            <h1 className='text-2xl font-semibold mb-3 text-white'>Welcome to ChatApp👋</h1>
            <label htmlFor='name'>Enter your name:</label>
            <input required name='name' id='name' onChange={handleUsername} value={userData.username} type='text' />
            <Button className='btn' onClick={handleSubmit}>Submit</Button>
          </form>
        </div>
      }
    </div>
  )
}

export default App