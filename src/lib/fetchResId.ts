export const fetchRestId =async ()=>{
  try{
    const response = await fetch("http://localhost:3000/restId",{
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