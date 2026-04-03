//! Application error types
#![allow(dead_code)]

#[derive(Debug)]
pub enum AppError {
    // TODO: Error variants
}

pub type Result<T> = std::result::Result<T, AppError>;
