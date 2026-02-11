import React from "react";

function EmbedForm() {
    const [imageFile, setImageFile] = React.useState(null);
    const [message, setMessage] = React.useState("");
    const [steggedUrl, setSteggedUrl] = React.useState("");

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleMessageChange = (e) => {
        setMessage(e.target.value);
    };

    const handleEmbed = async (e) => {
        e.preventDefault();
        console.log('handleEmbed clicked', { imageFile, message });
        if (!imageFile || !message) {
            alert("Please select an image file and enter a message.");
            return;
        }

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("message", message);

        try {
            const response = await fetch("http://localhost:5000/lsb", {
                method: "POST",
                body: formData,
            });
            console.log("Response status:", response.status);
            console.log("Response ok:", response.ok);
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to embed message. Status: " + response.status);
                return;
            }
            
            const data = await response.json();
            console.log("Response data:", data);
            setSteggedUrl(data.steggedUrl);
        } catch (error) {
            console.error("Error embedding message:", error);
            console.error("Error stack:", error.stack);
            console.error("Error message:", error.message);
            alert("Failed to embed message. Please try again.");
        }
    };

  return (
    <div className="embed-form">
      <h2>Embed Message into Image</h2>
      <form onSubmit={handleEmbed}>
        <input type="file" accept="image/*" onChange={handleImageChange} />
      <textarea placeholder="Enter your secret message here" onChange={handleMessageChange}></textarea>
      <button type="submit">Embed Message</button>
    </form>
        {steggedUrl && (
            <div className="stegged-result">
                <h3>Stegged Image</h3>
                <p>
                    <a href={steggedUrl} target="_blank" rel="noreferrer">Open stegged image</a>
                </p>
                <img src={steggedUrl} alt="Stegged" style={{ maxWidth: '100%' }} />
            </div>
        )}
  </div>
  );
}
export default EmbedForm;