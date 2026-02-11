import React from "react";

function ExtractForm() {
    const [imageFile, setImageFile] = React.useState(null);
    const [extractedMessage, setExtractedMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);

    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    const handleExtract = async (e) => {
        e.preventDefault();
        console.log('handleExtract clicked', { imageFile });
        if (!imageFile) {
            alert("Please select an image file first.");
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append("image", imageFile);  
        
        try {
            const response = await fetch("http://localhost:5000/extract/lsb", {
                method: "POST",
                body: formData,
            });
            
            if (!response.ok) {
                const errorText = await response.text();
                console.error("Response error:", errorText);
                alert("Failed to extract message. Status: " + response.status);
                return;
            }

            const data = await response.json();
            console.log("Extract response:", data);
            const message = data.extractedMessage || data.hiddenData || "";
            console.log("Extracted message:", message);
            setExtractedMessage(message);
        } catch (error) {
            console.error("Error extracting message:", error);
            alert("Failed to extract message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="extract-form">
            <h2>Extract Message from Image</h2>
            <form onSubmit={handleExtract}>
                <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageChange}
                />
                <button type="submit" disabled={loading}>
                    {loading ? "Extracting..." : "Extract Message"}
                </button>
            </form>
            {extractedMessage && (
                <div className="extracted-message">
                    <h3>Extracted Message:</h3>
                    <p>{extractedMessage}</p>
                </div>
            )}
        </div>
    );
}

export default ExtractForm;