import React from "react";


function EmbedForm({ embedMethod, setEmbedMethod, lsbType, setLsbType, setDifferenceMap, setSteggedUrl, setOriginalImage, steggedUrl }) {
    const [imageFile, setImageFile] = React.useState(null);
    const [message, setMessage] = React.useState("");
    const [loading, setLoading] = React.useState(false);
    const [secretKey, setSecretKey] = React.useState("");
    const [remainingCapacity, setCapacity] = React.useState(null);
    const [isDragging, setIsDragging] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [ validImage, setValidImage] = React.useState(true);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!imageFile || !message) {
            alert("Please select an image file and enter a message.");
            return;
        }

        if (embedMethod === "lsb" && lsbType === "random" && !secretKey) {
            alert("Please enter a secret key for random LSB.");
            return;
        }

        setLoading(true);

        const formData = new FormData();
        formData.append("image", imageFile);
        formData.append("message", message);

        const encoder = new TextEncoder(); 
        const byteArray = encoder.encode(message);
        const byteLength = byteArray.length;

        if (embedMethod === "lsb") {
            formData.append("lsbType", lsbType);
            if (lsbType === "random"){ 
                formData.append("secretKey", secretKey);
            }
        }

        try {
            const endpoint = embedMethod === "lsb" ? "lsb" : "dct";
            const response = await fetch(`http://localhost:5000/${endpoint}`, {
                method: "POST",
                body: formData,
            });
            
            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
                alert(`Error: ${errorData.message || "Failed to embed message."}`);
                return;
            }

            const data = await response.json();
            setSteggedUrl(data.steggedUrl);
            setDifferenceMap(data.differenceUrl);
        } catch (error) {
            console.error("Error embedding message:", error);
            alert("Failed to embed message. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleDownload = async () => {
        if (!steggedUrl || !imageFile) return;

        try {
            const response = await fetch(steggedUrl);
            const blob = await response.blob();

            const blobUrl = window.URL.createObjectURL(blob);

            const originalName = imageFile.name;
            const nameWithoutExt = 
                originalName.substring(0, originalName.lastIndexOf(".")) || originalName;
            const extension = ".png"
            const now = new Date();
            const formattedDate = now.toISOString()
            .replace("T", "_")
            .replace(/:/g, "-")
            .split(".")[0];

            const finalFileName = `${nameWithoutExt}_stegged_${formattedDate}${extension}`;

            const link = document.createElement("a");
            link.href = blobUrl;
            link.download = finalFileName;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            window.URL.revokeObjectURL(blobUrl);

        } catch (error) {
            console.error("Download failed:", error);
        }
    };


    const onImageUpload = async (e) => {
        const file = e.target ? e.target.files[0] : e; 

        try {
            const formData = new FormData();
            formData.append("image", file);
            const response = await fetch("http://localhost:5000/validate-image", {
                method: "POST",
                body: formData,
            });
            console.log("Validation response status:", response.status);

            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
                alert(`Image validation failed: ${errorData.message || "Invalid image."}`);
                setValidImage(false);
                return;
            }
        } catch (error) {
            console.error("Error validating image:", error);
        }

        const url = URL.createObjectURL(file);
        setImageFile(file);
        setPreviewUrl(url);
        setOriginalImage(url)

        if (!file) return;

        try {
            const formData = new FormData();
            formData.append("image", file);
            formData.append("embedMethod", embedMethod);
            const response = await fetch("http://localhost:5000/capacity", {
                method: "POST",
                body: formData,
            });


            if (!response.ok) {
                const errorData = await response.json();
                console.error("Response error:", errorData);
                alert(`Failed to check image capacity: ${errorData.message || "Unknown error."}`);
                console.error("Capacity error response:", errorData);
                return;
            }
            
            const data = await response.json();

            if (embedMethod === "lsb") {
                const maxChars = Math.floor((data.capacity.bits / 8) * 0.994);
                setCapacity(maxChars);
            } else if (embedMethod === "dct") {
                setCapacity(Math.floor((data.capacity.bits / 8) * 0.97));
            }

        } catch (error) {
            console.error("Error checking image capacity:", error);
        }

    };

    const handleTextareaChange = (e) => {
    setMessage(e.target.value);

    e.target.style.height = 'inherit';
    e.target.style.height = `${e.target.scrollHeight}px`
    };

    return (
        <div className="embed-form">

            <div className="label">Embedding Method</div>
            <div className="button">
            <button 
                className={embedMethod === "lsb" ? "active" : ""} 
                onClick={() => setEmbedMethod("lsb")}
            >
                LSB (Spatial)
            </button>

            <button 
                className={embedMethod === "dct" ? "active" : ""} 
                onClick={() => { setEmbedMethod("dct"); setSecretKey(""); }}    
            >
                DCT (Frequency)
            </button>
            </div>
            {embedMethod === "lsb" ? (
            <div>
                <label className="sub-label">LSB Mode</label>
                <div className="button">
                    <button className={lsbType === "sequential" ? "active" : ""} onClick={() => setLsbType("sequential")}>Sequential</button>
                    <button className={lsbType === "random" ? "active" : ""} onClick={() => setLsbType("random")}>Random</button>
                </div>
            </div>
            ) : (
                <div>
                    <p className="label" style={{margin: 0, opacity: 0.7}}></p>
                </div>
            )}
            <div style={{height: '20px'}}></div>
            <div 
                className={`file-drop-area ${isDragging ? "dragging" : ""} ${previewUrl ? "has-file" : ""}`} 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }} 
                onDragLeave={() => setIsDragging(false)} 
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); onImageUpload(e.dataTransfer.files[0]); }}
                onClick={() => document.getElementById('hiddenFileInput').click()}
            >
                {previewUrl ? (
                    <div className="upload-preview">
                        <img src={previewUrl} alt="Preview" style={{maxHeight: '160px', borderRadius: '8px'}} />
                        <p style={{marginTop: '10px', fontSize: '0.8rem'}}>Change Image</p>
                    </div>
                ) : (
                    <>
                        <div style={{fontSize: '1.5rem', marginBottom: '8px'}}>📁</div>
                        <p>Drop image or <span>click to browse</span></p>
                    </>
                )}
                <input 
                    id="hiddenFileInput"
                    type="file" 
                    accept="image/*" 
                    onChange={onImageUpload} 
                    style={{display: 'none'}} 
                />
            </div>

            {embedMethod === "lsb" && lsbType === "random" && (
               <div className="input-box">
                <label className="sub-label">Secret Key</label>
                <div className="password-input-wrapper">
                    <div className="input-with-icon">
                        <input
                            className="form-control"
                            type={showPassword ? "text" : "password"}
                            value={secretKey}
                            onChange={(e) => setSecretKey(e.target.value)}
                            placeholder="Required for Random LSB"
                        />
                        <button 
                            type="button"
                            className={`eye-toggle-button ${showPassword ? 'active' : ''}`}
                            onClick={() => setShowPassword(!showPassword)}
                            aria-label={showPassword ? "Hide password" : "Show password"}>
                                👁
                        </button>
                    </div>
                </div>
</div>
            )}
            <div style={{height: '20px'}}></div>

            <div className="input-box">
                <label className="sub-label">Secret Message</label>
                <div className="textarea-wrapper">
                    <textarea
                        className="placeholder-input"
                        value={message}
                        onChange={handleTextareaChange}
                        placeholder="What's the secret?"
                        maxLength={remainingCapacity || undefined}
                        rows="4"
                        style={{resize: 'none', overflow: 'hidden', minHeight: '100px'}}
                    />
                    {remainingCapacity !== null && (
                        <span className="capacity-indicator-text">
                            {remainingCapacity - message.length} characters remaining
                        </span>
                    )}
                </div>
            </div>
            <div style={{height: '20px'}}></div>

            <button className="submit-button" onClick={handleSubmit} disabled={loading || !imageFile || !message  || !validImage || (embedMethod === "lsb" && lsbType === "random" && !secretKey)}>
                {loading ? "Embedding..." : "Embed Message"}
            </button>
            <div style={{height: '20px'}}></div>
            {steggedUrl && (
                    <button className="download-button" onClick={handleDownload}>
                        Download Stegged Image
                    </button>
            )}
        </div>
    );
}

export default EmbedForm;
