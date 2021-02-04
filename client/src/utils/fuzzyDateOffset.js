export const fuzzyDateOffset = (datestring) => {
    const offsetTime = new Date(datestring).getTime();
    const currentTime = new Date().getTime();
    const weekInMilliseconds = 7*24*60*60*1000; 
    const dayInMilliseconds = 24*60*60*1000; 
    const hourInMilliseconds = 60*60*1000; 
    const diff = currentTime - offsetTime;

    if ( diff > weekInMilliseconds ) {
        const weeks = Math.floor(diff/weekInMilliseconds); 
        return `${weeks} ${(weeks === 1)? "week":"weeks"} ago`;
    } else if ( diff > dayInMilliseconds) {
        const days = Math.floor(diff/dayInMilliseconds); 
        return `${days} ${(days === 1)? "day":"days"} ago`;
    } else if ( diff > hourInMilliseconds) {
        const hours = Math.floor(diff/hourInMilliseconds); 
        return `${hours} ${(hours === 1)? "hour":"hours"} ago`;
    } else {
        const minutes = Math.floor(diff/60000);
        return `${minutes} ${(minutes === 1)? "minute":"minutes"} ago`;
    }
}
