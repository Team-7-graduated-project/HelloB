import { useEffect, useState, useContext } from "react";
import { UserContext } from "../UserContext";
import axios from "axios";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { FaPaperPlane, FaUser, FaComments, FaArrowLeft } from "react-icons/fa";
import AccountNav from "../AccountNav";

const messageBubbleStyle = `
  relative rounded-2xl px-4 py-2 max-w-[80%] break-words
  before:content-[''] before:absolute before:bottom-[6px]
  before:w-4 before:h-4 before:transform before:rotate-45
  transition-all duration-300 shadow-sm
`;

const leftBubbleStyle = `
  ${messageBubbleStyle}
  bg-white border border-gray-100
  before:-left-1.5 before:border-l before:border-b before:border-gray-100 before:bg-white
`;

const rightBubbleStyle = `
  ${messageBubbleStyle}
  bg-primary text-white
  before:-right-1.5 before:border-r before:border-t before:border-primary before:bg-primary
`;

export default function MessagesPage() {
  const { user } = useContext(UserContext);
  const [chats, setChats] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [ws, setWs] = useState(null);

  // Helper function to get other participant
  const getOtherParticipant = (chat) => {
    if (!chat?.participants || !user?._id) return null;
    return chat.participants.find((p) => p._id !== user._id);
  };

  // Fetch all chats
  useEffect(() => {
    const loadChats = async () => {
      if (user?._id) {
        try {
          const { data } = await axios.get("/chats");
          setChats(data);
          setIsLoading(false);
        } catch (error) {
          console.error("Failed to fetch chats:", error);
          toast.error("Failed to load messages");
        }
      }
    };
    loadChats();
  }, [user?._id]);


  // WebSocket connection
// Update the WebSocket connection useEffect
useEffect(() => {
  let websocket;
  if (selectedChat?._id && user?._id) {
    // Add error handling for WebSocket connection
    try {
      websocket = new WebSocket(
        `wss://hellob-be.onrender.com/ws?userId=${user._id}&chatId=${selectedChat._id}`
      );

      websocket.onopen = () => {
        console.log("WebSocket connected");
        setWs(websocket);
      };

      websocket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (message.type === "chat") {
            // Update both selected chat and chats list
            setSelectedChat(prev => ({
              ...prev,
              messages: [...prev.messages, message.data]
            }));
            
            setChats(prevChats => 
              prevChats.map(chat => {
                if (chat._id === selectedChat._id) {
                  return {
                    ...chat,
                    messages: [...chat.messages, message.data]
                  };
                }
                return chat;
              })
            );
          }
        } catch (error) {
          console.error("Error processing message:", error);
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection error. Messages may not be real-time.");
      };

      websocket.onclose = () => {
        console.log("WebSocket disconnected");
        setWs(null);
        // Attempt to reconnect after a delay
        setTimeout(() => {
          if (selectedChat?._id && user?._id) {
            console.log("Attempting to reconnect...");
          }
        }, 3000);
      };
    } catch (error) {
      console.error("WebSocket connection error:", error);
      toast.error("Failed to establish real-time connection");
    }
  }

  return () => {
    if (websocket) {
      websocket.close();
    }
  };
}, [selectedChat?._id, user?._id]);

// Update the sendMessage function
const sendMessage = async (e) => {
  e.preventDefault();
  if (!newMessage.trim() || !selectedChat?._id) return;

  const messageData = {
    chatId: selectedChat._id,
    content: newMessage.trim(),
    sender: user._id,
    timestamp: new Date().toISOString() // Ensure timestamp is included
  };

  try {
    // Send through WebSocket if connected
    if (ws?.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        type: "chat",
        data: messageData
      }));
    }

    // Send through HTTP for persistence
    const { data } = await axios.post(`/chats/${selectedChat._id}/messages`, {
      content: newMessage.trim()
    });

    // Update UI immediately
    const newMessageObj = {
      ...data,
      timestamp: new Date().toISOString()
    };

    setSelectedChat(prev => ({
      ...prev,
      messages: [...prev.messages, newMessageObj]
    }));

    // Update chat list
    setChats(prevChats => 
      prevChats.map(chat => {
        if (chat._id === selectedChat._id) {
          return {
            ...chat,
            messages: [...chat.messages, newMessageObj]
          };
        }
        return chat;
      })
    );

    setNewMessage("");
  } catch (error) {
    console.error("Failed to send message:", error);
    toast.error("Failed to send message");
  }
};

  // Add this helper function at the top of your component
  const groupMessagesByDate = (messages) => {
    const groups = {};
    messages.forEach((message) => {
      const date = format(new Date(message.timestamp), "dd/MM/yyyy");
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(message);
    });
    return groups;
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-gray-50">
      <AccountNav />
      <div className="flex-1 container mx-auto p-4 md:p-8">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 h-[calc(100vh-180px)] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
              <FaComments className="text-primary" />
              Messages
            </h1>
            {selectedChat && (
              <button 
                onClick={() => setSelectedChat(null)}
                className="md:hidden p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <FaArrowLeft />
              </button>
            )}
          </div>

          {/* Chat Container */}
          <div className="flex-1 flex overflow-hidden">
            {/* Chat List - Left sidebar */}
            <div className={`w-full md:w-80 border-r flex-shrink-0 bg-white ${
              selectedChat ? 'hidden md:block' : 'block'
            }`}>
              <div className="h-full overflow-y-auto">
                {chats.map((chat) => {
                  const otherParticipant = getOtherParticipant(chat);
                  const lastMessage = chat.messages[chat.messages.length - 1];
                  
                  return (
                    <div
                      key={chat._id}
                      onClick={() => setSelectedChat(chat)}
                      className={`p-4 hover:bg-gray-50 cursor-pointer transition-colors border-b
                        ${selectedChat?._id === chat._id ? "bg-gray-50" : ""}
                      `}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <div className="w-12 h-12 rounded-full bg-gray-100 overflow-hidden">
                            {otherParticipant?.photo ? (
                              <img
                                src={otherParticipant.photo}
                                alt=""
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <FaUser className="w-full h-full p-3 text-gray-400" />
                            )}
                          </div>
                          {otherParticipant?.isActive && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 rounded-full border-2 border-white" />
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex justify-between items-baseline">
                            <h3 className="font-medium text-gray-900 truncate">
                              {otherParticipant?.name || "Loading..."}
                            </h3>
                            {lastMessage && (
                              <span className="text-xs text-gray-500">
                                {format(new Date(lastMessage.timestamp), "h:mm a")}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500 truncate">
                            {lastMessage?.content || "No messages yet"}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Chat Window */}
            <div className={`flex-1 flex flex-col ${
              !selectedChat ? 'hidden md:flex' : 'flex'
            }`}>
              {selectedChat ? (
                <>
                  {/* Chat Header */}
                  <div className="p-4 border-b bg-white flex items-center gap-3">
                    <div className="relative">
                      <div className="w-10 h-10 rounded-full bg-gray-100 overflow-hidden">
                        {getOtherParticipant(selectedChat)?.photo ? (
                          <img
                            src={getOtherParticipant(selectedChat).photo}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <FaUser className="w-full h-full p-2 text-gray-400" />
                        )}
                      </div>
                      {getOtherParticipant(selectedChat)?.isActive && (
                        <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-white" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">
                        {getOtherParticipant(selectedChat)?.name || "Loading..."}
                      </h3>
                      <p className="text-xs text-gray-500">
                        {getOtherParticipant(selectedChat)?.isActive ? "Active now" : "Offline"}
                      </p>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto bg-gray-50 p-4">
                    <div className="space-y-6">
                      {Object.entries(groupMessagesByDate(selectedChat.messages)).map(([date, messages]) => (
                        <div key={date} className="space-y-4">
                          <div className="flex items-center justify-center">
                            <span className="bg-gray-200/70 backdrop-blur-sm px-3 py-1 rounded-full text-xs text-gray-600">
                              {date === format(new Date(), "dd/MM/yyyy") ? "Today" : date}
                            </span>
                          </div>

                          {messages.map((message, index) => (
                            <div
                              key={index}
                              className={`flex items-end gap-2 ${
                                message.sender === user?._id ? "justify-end" : "justify-start"
                              }`}
                            >
                              {message.sender !== user?._id && (
                                <div className="w-6 h-6 rounded-full overflow-hidden flex-shrink-0">
                                  <img
                                    src={getOtherParticipant(selectedChat)?.photo || "/default-avatar.png"}
                                    alt=""
                                    className="w-full h-full object-cover"
                                  />
                                </div>
                              )}
                              <div className={message.sender === user?._id ? rightBubbleStyle : leftBubbleStyle}>
                                <p>{message.content}</p>
                                <div className={`text-[10px] mt-1 ${
                                  message.sender === user?._id ? "text-white/70" : "text-gray-400"
                                }`}>
                                  {format(new Date(message.timestamp), "h:mm a")}
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Message Input */}
                  <div className="p-4 bg-white border-t">
                    <form onSubmit={sendMessage} className="flex gap-2">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        placeholder="Type your message..."
                        className="flex-1 h-12 px-4 py-2 border border-gray-200 rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary"
                      />
                      <button
                        type="submit"
                        disabled={!newMessage.trim()}
                        className={`h-12 w-12 rounded-xl flex items-center justify-center transition-colors ${
                          newMessage.trim()
                            ? "bg-primary text-white hover:bg-primary-dark"
                            : "bg-gray-100 text-gray-400 cursor-not-allowed"
                        }`}
                      >
                        <FaPaperPlane className="w-4 h-4" />
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex items-center justify-center text-gray-500 bg-gray-50">
                  <div className="text-center">
                    <FaComments className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                    <p>Select a conversation to start messaging</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
