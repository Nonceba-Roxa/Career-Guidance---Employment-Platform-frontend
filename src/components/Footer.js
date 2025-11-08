import React from 'react';
import { Box, Typography, Link } from '@mui/material';

const Footer = () => {
  return (
    <Box className="footer">
      <Typography variant="body1">
        &copy; {new Date().getFullYear()} Career Guidance Platform. All rights reserved.
      </Typography>
    </Box>
  );
};

export default Footer;
