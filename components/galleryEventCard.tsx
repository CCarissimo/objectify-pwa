const GalleryEventCard = ({ event }) => {
    // Get the first image from the event if it exists
    const firstImage = event.tags.find(tag => tag[0] === 'image');
    
    return (
        <div className="flex flex-col h-full">
            {/* Image thumbnail */}
            <div className="h-40 bg-gray-100">
            {firstImage ? (
                <img 
                src={firstImage[1]} 
                alt="Event" 
                className="w-full h-full object-cover"
                />
            ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400">
                No image
                </div>
            )}
            </div>
            
            {/* Card content */}
            <div className="p-3 flex-1">
            {/* Author info */}
            <div className="flex items-center mb-2">
                <div className="w-6 h-6 rounded-full bg-gray-300 mr-2"></div>
                <div className="text-sm font-medium truncate">
                {event.pubkey.slice(0, 8)}...
                </div>
            </div>
            
            {/* Content preview */}
            <p className="text-sm line-clamp-3 mb-2">
                {event.content}
            </p>
            
            {/* Time */}
            <div className="text-xs text-gray-500">
                {new Date(event.created_at * 1000).toLocaleString()}
            </div>
            </div>
        </div>
    );
  };

export default GalleryEventCard;