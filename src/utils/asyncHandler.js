const asyncHandler = (requesthandler) => {
  return (req, res, next) => {
    Promise.resolve(requesthandler(req, res, next))
      .catch((err) => next(err));
  };
};

export { asyncHandler };

// const asyncHandler=(fn)=>async(req,res,next)=>{
//     try { 
//         await req,res,next
//     } catch (error) {
//         res.status(err.code || 500)
//         sucess:false
//         message:err.message
//     }
// }