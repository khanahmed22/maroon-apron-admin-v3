export const fetchRestId =async ()=>{
  try{
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/restId`,{
      method:'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      credentials:'include'
    })
    const data = await response.json()
    
    console.log(data)
    return data
  }
  catch(err){
    console.log(err)
  }
}