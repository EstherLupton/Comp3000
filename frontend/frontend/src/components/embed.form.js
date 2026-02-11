import React from "react";

function EmbedForm() {
    const [imageFile, setImageFile] = React.useState(null);
    const [message, setMessage] = React.useState("");
    const [steggedUrl, setSteggedUrl] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleImageChange = (e) => setImageFile(e.target.files[0]);
    const handleMessageChange = (e) => setMessage(e.target.value);

    const handleEmbed = async (e) => {
        e.preventDefault();
        if (!imageFile || !message) {
            alert("Please select an image file and enter a message.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("message", message);

        try {
            const response = await fetch("http://localhost:5000/lsb", {
                method: "POST",
                body: formData,
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to embed message. Status: " + response.status);
                return;
            }

            const data = await response.json();
            setSteggedUrl(data.steggedUrl);
        } catch (error) {
            console.error("Error embedding message:", error);
            alert("Failed to embed message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="embed-form">
            <h2 className="h5">Embed Message</h2>
            <form onSubmit={handleEmbed}>
                <div className="mb-3">
                    <label className="form-label">Choose Image</label>
                    <input className="form-control" type="file" accept="image/*" onChange={handleImageChange} />
                </div>

                <div className="mb-3">
                    <label className="form-label">Secret Message</label>
                    <textarea className="form-control" placeholder="Enter your secret message here" value={message} onChange={handleMessageChange}></textarea>
                </div>

                <button className="btn btn-primary" type="submit" disabled={loading}>
                    {loading ? 'Embedding…' : 'Embed Message'}
                </button>
            </form>

            {steggedUrl && (
                <div className="stegged-result mt-3">
                    <h6>Stegged Image</h6>
                    <p>
                        <a href={steggedUrl} target="_blank" rel="noreferrer">Open stegged image</a>
                    </p>
                    <img src={steggedUrl} alt="Stegged" className="img-fluid" />
                </div>
            )}
        </div>
    );
}

export default EmbedForm;