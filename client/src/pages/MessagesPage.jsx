import { useEffect, useState, useContext } from "react";
import { UserContext } from "../UserContext";
import axios from "axios";
import { format } from "date-fns";
import { toast } from "react-hot-toast";
import { FaPaperPlane, FaUser } from "react-icons/fa";
import AccountNav from "../AccountNav";

const messageBubbleStyle = `
  relative before:content-[''] before:absolute before:bottom-0 
  before:w-2 before:h-2 before:transform
`;

const leftBubbleStyle = `
  ${messageBubbleStyle}
  before:-left-1 before:bg-gray-100 
  before:rotate-45
`;

const rightBubbleStyle = `
  ${messageBubbleStyle}
  before:-right-1 before:bg-primary 
  before:rotate-45
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
  useEffect(() => {
    let websocket;
    if (selectedChat?._id && user?._id) {
      websocket = new WebSocket(
        `wss://hellob-be.onrender.com?userId=${user._id}&chatId=${selectedChat._id}`
      );

      websocket.onopen = () => setWs(websocket);

      websocket.onmessage = (event) => {
        const message = JSON.parse(event.data);
        if (message.type === "chat") {
          setSelectedChat((prev) => ({
            ...prev,
            messages: [...prev.messages, message.data],
          }));

          // Update chat list to show latest message
          setChats((prevChats) => {
            return prevChats.map((chat) => {
              if (chat._id === selectedChat._id) {
                return {
                  ...chat,
                  messages: [...chat.messages, message.data],
                };
              }
              return chat;
            });
          });
        }
      };

      websocket.onerror = (error) => {
        console.error("WebSocket error:", error);
        toast.error("Connection error");
      };

      websocket.onclose = () => setWs(null);
    }

    return () => websocket?.close();
  }, [selectedChat?._id, user?._id]);

  // Send message through WebSocket
  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedChat?._id) return;

    try {
      // Send through WebSocket if connected
      if (ws?.readyState === WebSocket.OPEN) {
        ws.send(
          JSON.stringify({
            type: "chat",
            data: {
              chatId: selectedChat._id,
              content: newMessage.trim(),
              sender: user._id,
              timestamp: new Date(),
            },
          })
        );
      }

      // Also send through HTTP for persistence
      const { data } = await axios.post(`/chats/${selectedChat._id}/messages`, {
        content: newMessage.trim(),
      });

      setSelectedChat((prev) => ({
        ...prev,
        messages: [...prev.messages, data],
      }));

      // Update chat list
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat._id === selectedChat._id) {
            return {
              ...chat,
              messages: [...chat.messages, data],
            };
          }
          return chat;
        });
      });

      setNewMessage("");
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("Failed to send message");
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-8 h-screen flex flex-col">
      <AccountNav />
      <div className="container mx-auto flex-grow flex flex-col">
        <h1 className="text-2xl font-bold mb-4">Messages</h1>
        <div className="grid grid-cols-3 gap-4 flex-grow">
          {/* Chat List */}
          <div className="col-span-1 border rounded-lg overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
            {chats.map((chat) => {
              const otherParticipant = getOtherParticipant(chat);
              return (
                <div
                  key={chat._id}
                  onClick={() => setSelectedChat(chat)}
                  className={`p-4 border-b cursor-pointer hover:bg-gray-50 
                  ${selectedChat?._id === chat._id ? "bg-gray-100" : ""}`}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
                      {otherParticipant?.photo ? (
                        <img
                          src={otherParticipant.photo}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <FaUser className="w-full h-full p-2 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <h3 className="font-medium">
                        {otherParticipant?.name || "Loading..."}
                      </h3>
                      <p className="text-sm text-gray-500 truncate">
                        {chat.messages[chat.messages.length - 1]?.content ||
                          "No messages yet"}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Chat Window */}
          <div className="col-span-2 border rounded-lg flex flex-col">
            {selectedChat ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden">
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
                    <h3 className="font-medium">
                      {getOtherParticipant(selectedChat)?.name || "Loading..."}
                    </h3>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-grow p-4 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400">
                  <div className="flex flex-col-reverse">
                    {selectedChat.messages.map((message, index) => (
                      <div
                        key={index}
                        className={`flex items-end gap-2 mb-4 ${
                          message.sender === user?._id
                            ? "justify-end"
                            : "justify-start"
                        }`}
                      >
                        {message.sender !== user?._id && (
                          <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0">
                            <img
                              src={
                                getOtherParticipant(selectedChat)?.photo ||
                                "/default-avatar.png"
                              }
                              alt=""
                              className="w-full h-full object-cover"
                            />
                          </div>
                        )}
                        <div
                          className={`max-w-[70%] p-3 rounded-xl ${
                            message.sender === user?._id
                              ? `${rightBubbleStyle} bg-primary text-white`
                              : `${leftBubbleStyle} bg-gray-100`
                          }`}
                        >
                          <p className="break-words">{message.content}</p>
                          <div
                            className={`text-xs mt-1 ${
                              message.sender === user?._id
                                ? "text-white/70"
                                : "text-gray-500"
                            }`}
                          >
                            {format(new Date(message.timestamp), "h:mm a")}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Message Input */}
                <form onSubmit={sendMessage} className="p-4 border-t">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-grow p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50"
                    />
                    <button
                      type="submit"
                      disabled={!newMessage.trim()}
                      className={`px-6 py-3 rounded-xl font-medium flex items-center gap-2 transition-all
                      ${
                        newMessage.trim()
                          ? "bg-primary text-white hover:bg-primary-dark"
                          : "bg-gray-100 text-gray-400 cursor-not-allowed"
                      }`}
                    >
                      <FaPaperPlane className="w-4 h-4" />
                      Send
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-grow flex items-center justify-center text-gray-500">
                Select a chat to start messaging
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
