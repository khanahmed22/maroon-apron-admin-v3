export const fetchRestId =async ()=>{
  try{
    const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/restId`,{
      method:'POST',
      headers:{
        'Content-Type': 'application/json'
      },
      credentials:'include'
    })
    return response.json()
  }
  catch(err){
    console.log(err)
  }
}